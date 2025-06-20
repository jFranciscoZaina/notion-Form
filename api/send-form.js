export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Only POST requests allowed" });
  }

  res.setHeader("Access-Control-Allow-Origin", "*");

  const { name, email, company, category, service } = req.body;

  if (!name || !email || !company || !category || !service) {
    return res.status(400).json({ success: false, error: "Missing fields" });
  }

  // Get current date as ISO string (yyyy-mm-dd)
  const now = new Date();
  const isoDate = now.toISOString().split("T")[0];

  try {
    const notionResponse = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.NOTION_TOKEN}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
      },
      body: JSON.stringify({
        parent: { database_id: process.env.NOTION_DATABASE_ID },
        properties: {
          Name: { title: [{ text: { content: name } }] },
          Email: { email: email },
          Company: { rich_text: [{ text: { content: company } }] },
          Category: { rich_text: [{ text: { content: category } }] },
          "Kind of service": {
  multi_select: [{ name: service }],
},
          "First touch": { date: { start: isoDate } },
          // You can add other fields here if needed
        },
      }),
    });

    if (!notionResponse.ok) {
      const text = await notionResponse.text();
      console.error("❌ Notion error:", text);
      return res.status(500).json({ success: false, error: "Notion error" });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("❌ Error:", error);
    return res.status(500).json({ success: false, error: "Server error" });
  }
}
