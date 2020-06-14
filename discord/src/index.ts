require("dotenv").config();
import Discord from "discord.js";
import { PatchCommand } from "./patchCommand";
import { graphCommand } from "./graphCommand";
const token = process.env.DISCORD_TOKEN;
const channels = [
    "670288429426409492",
    "215496692047413249",
    "218913447788806144",
    "607363475706216451",
    "658668097183547403"
]

export interface ICommand {
    name: string
    match: (message: Discord.Message) => boolean
    respond: (message: Discord.Message) => Promise<any>
}

const client = new Discord.Client();
const commands: ICommand[] = [];

commands.push( PatchCommand, graphCommand );

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
  });
  
  client.on('message', async msg => {
      if ( msg.member.user == client.user ) return;
      console.log({ user: msg.member.user.username, msg: msg.content, channel: msg.channel.id, ignore: channels.indexOf( msg.channel.id ) < 0 } );
      if ( !msg.guild?.me.permissionsIn( msg.channel ).has("SEND_MESSAGES") ) return;
      if ( channels.indexOf( msg.channel.id ) < 0 ) return;

      for (const command of commands) {
          if( command.match( msg ) ){
              console.log( `responding with "${command.name}" to message:\n\t${msg.content}` )
              msg.channel.startTyping()
              await command.respond( msg );
              msg.channel.stopTyping()
              break;
          }
      }
  });
  
  client.login(token)  