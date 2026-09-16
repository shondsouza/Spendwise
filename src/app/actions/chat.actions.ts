"use server";

import { endOfMonth, format, startOfDay, startOfMonth, subDays } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils/currency";
import { canUseChatbot } from "@/lib/constants/chatbot";

type ChatResponse = {
  data: string | null;
  error: string | null;
};

async function askGemini(question: string, userId: string): Promise<ChatResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      data: null,
      error: "SpendWise AI is not configured. Add GEMINI_API_KEY to .env.local.",
    };
  }

  const supabase = await createClient();
  const [{ data: expenses, error: expensesError }, { data: income, error: incomeError }] =
    await Promise.all([
      supabase
        .from("expenses")
        .select("title, amount, category, date")
        .eq("user_id", userId)
        .order("date", { ascending: false })
        .range(0, 99),
      supabase
        .from("income")
        .select("title, amount, category, date")
        .eq("user_id", userId)
        .order("date", { ascending: false })
        .range(0, 99),
    ]);

  if (expensesError || incomeError) {
    return { data: null, error: expensesError?.message || incomeError?.message || "Unable to load your data." };
  }

  const prompt = `You are the SpendWise dashboard assistant. Answer only questions about this web app and the user's personal financial data. Do not answer general knowledge, news, medical, legal, coding, or unrelated questions. If unrelated, say you can only help with SpendWise. Be concise and do not invent data. Use the supplied records when relevant.

User question: ${question}
Today's date is ${new Date().toISOString().slice(0, 10)}. Interpret relative dates such as "yesterday" from this date. Expense dates are stored as YYYY-MM-DD.

Recent expense records:
${JSON.stringify(expenses ?? [])}

Recent income records:
${JSON.stringify(income ?? [])}

For a total or calculation question, reply with one complete short sentence containing the final amount. Never stop mid-sentence. If there are no matching records, say the total is ₹0.00 rather than only saying 0.`;

  try {
    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const requestBody = JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 500 },
    });
    const requestGemini = () =>
      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: requestBody,
        cache: "no-store",
        signal: AbortSignal.timeout(15_000),
      });

    let response = await requestGemini();

    if (response.status === 429 || response.status >= 500) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      response = await requestGemini();
    }

    if (!response.ok) {
      const errorBody = (await response.json().catch(() => null)) as
        | { error?: { message?: string } }
        | null;
      const statusMessage =
        response.status === 400 || response.status === 401 || response.status === 403
          ? "Check that GEMINI_API_KEY is valid and that the Gemini API is enabled."
          : response.status === 404
            ? `The Gemini model "${model}" is unavailable.`
            : "SpendWise AI could not answer right now.";
      console.error("Gemini request failed", {
        status: response.status,
        message: errorBody?.error?.message,
      });
      return { data: null, error: `${statusMessage} Please try again.` };
    }

    const result = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const answer = result.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    return answer
      ? { data: answer, error: null }
      : { data: null, error: "SpendWise AI returned an empty response." };
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      return { data: null, error: "SpendWise AI took too long to respond. Please try again." };
    }
    return { data: null, error: "Unable to reach SpendWise AI right now. Please try again." };
  }
}

async function getCurrentBalance(userId: string): Promise<ChatResponse> {
  const supabase = await createClient();
  const now = new Date();
  const monthStart = format(startOfMonth(now), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(now), "yyyy-MM-dd");

  const [{ data: income, error: incomeError }, { data: expenses, error: expensesError }] =
    await Promise.all([
      supabase
        .from("income")
        .select("amount")
        .eq("user_id", userId)
        .gte("date", monthStart)
        .lte("date", monthEnd)
        .range(0, 9999),
      supabase
        .from("expenses")
        .select("amount")
        .eq("user_id", userId)
        .gte("date", monthStart)
        .lte("date", monthEnd)
        .range(0, 9999),
    ]);

  if (incomeError || expensesError) {
    return {
      data: null,
      error: incomeError?.message || expensesError?.message || "Unable to calculate your balance.",
    };
  }

  const totalIncome = (income ?? []).reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
  const totalExpenses = (expenses ?? []).reduce(
    (sum, row) => sum + (Number(row.amount) || 0),
    0
  );

  return {
    data: `Your current balance for ${format(now, "MMMM")} is ${formatCurrency(totalIncome - totalExpenses)} (income ${formatCurrency(totalIncome)} minus expenses ${formatCurrency(totalExpenses)}).`,
    error: null,
  };
}

async function getExpenseTotal(
  userId: string,
  startDate: Date,
  endDate: Date,
  periodLabel: string
): Promise<ChatResponse> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expenses")
    .select("amount")
    .eq("user_id", userId)
    .gte("date", format(startDate, "yyyy-MM-dd"))
    .lte("date", format(endDate, "yyyy-MM-dd"))
    .range(0, 9999);

  if (error) {
    return { data: null, error: error.message };
  }

  const total = (data ?? []).reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
  return {
    data: `You spent ${formatCurrency(total)} ${periodLabel}.`,
    error: null,
  };
}

export async function answerDashboardQuestion(message: string): Promise<ChatResponse> {
  const question = message.trim();
  if (!question) {
    return { data: null, error: "Ask me a question about your finances." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: "You need to be signed in to use the dashboard assistant." };
  }

  if (!canUseChatbot(user.email)) {
    return { data: null, error: "The dashboard assistant is not available for this account." };
  }

  const normalized = question.toLowerCase();
  const unrelatedTopicPattern =
    /\b(vscode|visual studio code|javascript|typescript|python|programming|coding|weather|news|movie|music|sports|recipe|joke|history|math|science|politics|medical|法律|legal)\b/;
  if (unrelatedTopicPattern.test(normalized)) {
    return {
      data: "I can only help with questions about SpendWise expenses, income, balance, transactions, categories, and dashboard features.",
      error: null,
    };
  }

  if (/\b(balance|current balance|net balance)\b/i.test(question)) {
    return getCurrentBalance(user.id);
  }

  const now = new Date();
  if (
    /\b(total|how much|spent|spend|expense|expenses)\b/.test(normalized) &&
    /\bthis month\b/.test(normalized)
  ) {
    return getExpenseTotal(user.id, startOfMonth(now), endOfMonth(now), "this month");
  }

  if (/\b(spent|spend|expense|expenses)\b/.test(normalized) && /\byesterday\b/.test(normalized)) {
    const yesterday = subDays(startOfDay(now), 1);
    return getExpenseTotal(user.id, yesterday, yesterday, "yesterday");
  }

  return askGemini(question, user.id);
}
