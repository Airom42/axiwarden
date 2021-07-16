require('dotenv').config();
//Discord client
const Discord = require("discord.js")
const discordClient = new Discord.Client()

//Google Client
const vision = require("@google-cloud/vision")
const googleClient = new vision.ImageAnnotatorClient({
  keyFilename: "./cloudAPIKey.json",
})

discordClient.on("ready", () => {
  console.log(`Logged in as ${discordClient.user.tag}!`);
})

discordClient.on("message", msg => {
  if (msg.author.bot) {return;}

  // const command = msg.content
  // const image = msg.attachments


  if (msg.content === "ping") {
    msg.channel.send("Pong")
  }
  if (msg.content === "die") {
    console.log('Shutting down')
    discordClient.destroy();
  }
  if(msg.attachments.size > 0 && msg.attachments.every(attachIsImage)) {
    const attachment = msg.attachments.array()[0]
    if(attachment.size > 4000000) return
    msg.channel.send("Processing...")
    console.log("Sending image...")
    const url = attachment.url
    googleClient
      // .textDetection(url)
      .textDetection("./testImage.png")
      .then((results) => {
        console.log("Reply recieved")
        if(results[0].error != null) {
          console.log("ERROR: " + results[0].error.message)
          return
        }
        console.log(results[0])
        const visionText = results[0].textAnnotations[0].description
        console.log(visionText.indexOf("\n"))
        // console.log(visionText.indexOf("Startport Status Update"))
        var fieldArray = []
        let messageToReturn = "Confirmed Target Systems in order of priority (Top to Bottom)"
        if(visionText.indexOf("no reports of") != -1) {
          //No incursion case
          messageToReturn += "\n \n Status: **CODE YELLOW** :yellow_square:"
          fieldArray.push({ name: "**Incursions:**", value: "No Incursions detected. Please aid with starport repairs and standby for additional attacks."})
        }
        else {
          //yes incursion case
          messageToReturn += "\n \n Status: **CODE RED** :red_square:"
          fieldArray.push({ name: "**Incursions:**", value: parseIncursionSystems(visionText)})
        }
        if(visionText.indexOf("Starport Status Update") != -1) {
          fieldArray.push({ name: "**Evacuations:**", value: parseDamagedStarports(visionText)})
        }
        console.log(fieldArray)
        const returnEmbed = new Discord.MessageEmbed()
          .setAuthor('The Anti-Xeno Initiative')
          .setTitle("**Defense Targets**")
          .setDescription(messageToReturn)
          .setTimestamp()
        fieldArray.forEach((field) => {
          returnEmbed.addField(field.name, field.value)
        })
        msg.channel.send({ embed: returnEmbed })
      })
  }
})

function attachIsImage(msgAttach) {
  const url = msgAttach.url;
  //True if this url is a png image.
  return url.indexOf("png", url.length - "png".length /*or 3*/) !== -1 || url.indexOf("jpg", url.length - "jpg".length /*or 3*/) !== -1;
}

function parseIncursionSystems(text) {
  let systemList = text.substring(text.indexOf(":") + 1)
  if(systemList.indexOf("Starport Status Update") != -1) systemList = systemList.substring(0, text.indexOf("Starport") - 1)
  systemList = systemList.split(".")
  let returnStr = "\n"
  systemList.forEach((item) => {
    if(item.indexOf(":") != -1) {
      const system = item.substring(0, item.indexOf(":"))
      if(system.indexOf("[") != -1) {
        returnStr += "- " + system.substring(1, system.length - 1) + " [" + item.substring(item.indexOf(":") + 1) + "] :tharg_r:\n"
      }
      else {
        returnStr += "- " + system + " [Thargoid presence eliminated] :tharg_g:\n"
      }
    }
  })
  return returnStr
}

function parseDamagedStarports(text) {
  const starportList = text.substring(text.indexOf("Update") + 5)
  return starportList
}

discordClient.login(process.env.TOKEN)
