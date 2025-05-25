const { Client } = require("@notionhq/client")

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
})

const databaseId = process.env.NOTION_DB_ID

export default async function handler(req, res) {
  try {
    const response = await notion.databases.query({
      database_id: databaseId,
    })

    const today = new Date()
    const items = response.results.map((page) => {
      const props = page.properties
      const name = props.Name?.title?.[0]?.plain_text || "Sin nombre"
      const url = props.URL?.url || ""
      const pass = props.Pass?.rich_text?.[0]?.plain_text || ""

      const dateString = props["First touch"]?.date?.start
      const firstTouchDate = dateString ? new Date(dateString) : null

      const isValid = firstTouchDate
        ? firstTouchDate <= today // Cambiá esta condición según tu regla
        : false

      return {
        name,
        url,
        pass,
        firstTouchDate,
        isValid,
      }
    })

    res.status(200).json(items)
  } catch (err) {
    console.error("Error fetching or parsing data:", err)
    res.status(500).json({ error: "Failed to fetch or validate Notion data" })
  }
}
