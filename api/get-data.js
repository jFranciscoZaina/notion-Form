export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    res.setHeader("Access-Control-Allow-Headers", "Content-Type")
    return res.status(200).end()
  }

  if (req.method !== "GET") {
    return res.status(405).json({ message: "Only GET requests allowed" })
  }

  res.setHeader("Access-Control-Allow-Origin", "*")

  try {
    const notionResponse = await fetch(
      `https://api.notion.com/v1/databases/${process.env.NOTION_DATABASE_ID}/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.NOTION_TOKEN}`,
          "Content-Type": "application/json",
          "Notion-Version": "2022-06-28",
        },
      }
    )

    const data = await notionResponse.json()

    if (!notionResponse.ok) {
      console.error("❌ Notion error:", data)
      return res.status(500).json({ error: "Error al consultar Notion" })
    }

    const result = data.results.map((page) => {
      const props = page.properties
      return {
        url: props.URL?.url || null,
        pass: props.Pass?.rich_text?.[0]?.text?.content || null,
      }
    })

    return res.status(200).json(result)
  } catch (error) {
    console.error("❌ Error general:", error)
    return res.status(500).json({ error: "Error al consultar Notion" })
  }
}
