import nodemailer from "nodemailer"

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Only POST allowed" })
  }

  const { name, email, message } = req.body

  const notionToken = process.env.NOTION_TOKEN
  const databaseId = process.env.NOTION_DATABASE_ID

  // 👉 Guardar en Notion
  try {
    await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${notionToken}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28"
      },
      body: JSON.stringify({
        parent: { database_id: databaseId },
        properties: {
          Nombre: {
            title: [{ text: { content: name } }]
          },
          Email: {
            email: email
          },
          Mensaje: {
            rich_text: [{ text: { content: message } }]
          }
        }
      })
    })
  } catch (error) {
    console.error("Error al guardar en Notion:", error)
    return res.status(500).json({ success: false, error: "Error en Notion" })
  }

  // 👉 Enviar correos
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS
    }
  })

  const toAdmin = {
    from: process.env.MAIL_USER,
    to: process.env.MAIL_RECEIVER,
    subject: "Nuevo lead recibido",
    text: `Nombre: ${name}\nEmail: ${email}\nMensaje: ${message}`
  }

  const toLead = {
    from: process.env.MAIL_USER,
    to: email,
    subject: "Gracias por tu contacto 🙌",
    text: `Hola ${name},\n\nGracias por escribirnos. Ya recibimos tu mensaje y vamos a contactarte muy pronto.\n\n— El equipo de [Tu Marca]`
  }

  try {
    await transporter.sendMail(toAdmin)
    await transporter.sendMail(toLead)
    res.status(200).json({ success: true })
  } catch (error) {
    console.error("Error al enviar mail:", error)
    res.status(500).json({ success: false, error: "Error al enviar correos" })
  }
}
