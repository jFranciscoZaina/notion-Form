const { Client } = require("@notionhq/client")

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
})

const databaseId = process.env.NOTION_DB_ID

export default async function handler(req, res) {
  // ✅ Agregar estos encabezados
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")

  // ✅ Manejar el preflight (cuando el método es OPTIONS)
  if (req.method === "OPTIONS") {
    res.status(200).end()
    return
  }

  // ✅ Tu lógica original para conectarte a Notion
  try {
    const response = await notion.databases.query({ database_id: databaseId })

    const today = new Date()
    const items = response.results.map((page) => {
      const props = page.properties

      return {
        name: props.Name?.title?.[0]?.plain_text || "",
        url: props.URL?.url || "",
        pass: props.Pass?.rich_text?.[0]?.plain_text || "",
        firstTouchDate: props["First touch"]?.date?.start || null,
        isValid: props["First touch"]?.date?.start
          ? new Date(props["First touch"].date.start) <= today
          : false,
      }
    })

    res.status(200).json(items)
  } catch (error) {
    console.error("Error fetching data from Notion:", error)
    res.status(500).json({ error: "Failed to fetch Notion data" })
  }
}
