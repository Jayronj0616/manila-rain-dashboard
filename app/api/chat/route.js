import { NextResponse } from "next/server";

const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY;
const AZURE_OPENAI_DEPLOYMENT_NAME = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;

// Build the system instructions once. This embeds the per-area summary
// stats and the regression model results so the assistant can answer
// questions accurately without needing the full 36-row dataset every time.
// The full dataset is still included as a fallback in case a question
// needs a specific row not covered by the summary.
function buildInstructions(datasetContext) {
  const { dataset_overview, summary_per_area, model_info, full_cleaned_dataset } =
    datasetContext;

  return `You are a helpful assistant for a rain frequency forecasting project covering three areas in Metro Manila: Makati, Quezon City, and Manila.

DATASET OVERVIEW:
- Total records: ${dataset_overview.total_rows}
- Areas covered: ${dataset_overview.areas.join(", ")}
- Months covered: ${dataset_overview.months_covered.join(", ")}
- Correlation between Temperature and Rain Frequency: ${dataset_overview.temperature_rain_correlation}

SUMMARY STATISTICS PER AREA:
${summary_per_area
  .map(
    (a) =>
      `- ${a.Area}: avg temperature ${a.avg_temperature}°C (range ${a.min_temperature}-${a.max_temperature}°C), avg rain frequency ${a.avg_rain_frequency} (range ${a.min_rain_frequency}-${a.max_rain_frequency})`
  )
  .join("\n")}

PREDICTION MODEL:
- Type: ${model_info.model_type}
- RMSE: ${model_info.rmse}
- R² score: ${model_info.r2_score}
- Formula: Rain Frequency = ${model_info.intercept} + (${model_info.coefficient_temperature} * Temperature)

FULL CLEANED DATASET (use this only if the summary above doesn't answer the question):
${JSON.stringify(full_cleaned_dataset)}

Answer questions about this dataset clearly and concisely. If asked to predict rain frequency for a given temperature, use the formula above. If asked why the model's accuracy (R²) is low, explain that with only 36 rows and a single feature (temperature), location/area is actually a stronger predictor than temperature alone — Quezon City consistently has higher rain frequency than Makati or Manila at similar temperatures.`;
}

// Converts our simple {role, content} history array into the Responses
// API's expected "input" item format.
function buildInputFromHistory(history, message) {
  const items = [];

  if (Array.isArray(history)) {
    for (const turn of history) {
      if (turn && typeof turn.content === "string" && turn.role) {
        items.push({ role: turn.role, content: turn.content });
      }
    }
  }

  items.push({ role: "user", content: message });

  return items;
}

export async function POST(request) {
  try {
    const { message, history, dataset } = await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "A 'message' string is required." },
        { status: 400 }
      );
    }

    if (!dataset || typeof dataset !== "object") {
      return NextResponse.json(
        { error: "A 'dataset' object is required." },
        { status: 400 }
      );
    }

    if (
      !AZURE_OPENAI_ENDPOINT ||
      !AZURE_OPENAI_API_KEY ||
      !AZURE_OPENAI_DEPLOYMENT_NAME
    ) {
      return NextResponse.json(
        { error: "Azure OpenAI environment variables are not configured." },
        { status: 500 }
      );
    }

    const url = `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_OPENAI_DEPLOYMENT_NAME}/chat/completions?api-version=2024-08-01-preview`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": AZURE_OPENAI_API_KEY,
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: buildInstructions(dataset) },
          ...buildInputFromHistory(history, message),
        ],
        temperature: 0.5,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Azure OpenAI error:", response.status, errorText);
      return NextResponse.json(
        { error: "Azure OpenAI request failed.", details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content ?? "";

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Unexpected server error." },
      { status: 500 }
    );
  }
}
