const config = require('./config/config.js')
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const TelegramBot = require('node-telegram-bot-api')
const token = config.bot_token
const bot = new TelegramBot(token, {polling: true})
const Promise = require('promise')
const request = require('request')
bot.on('message', (msg) => {
    // console.log(msg) 
    if(msg.from.username != config.owner_username){
        bot.sendMessage(msg.chat.id, '<b> \u26A0 DANGER !!! \u26A0 </b> \n Anda bukan owner.', {parse_mode: "HTML"})
    }else{
        let searchCommand = new Promise((resolve,reject)=>{
            for (let i = 0; i < config.command.length; i++) {
                var command = config.command[i]
                if(msg.text.toString() == command){
                    resolve(command)
                }
            }
        })
        
        searchCommand.then((perintah)=>{
            if(perintah != ''){
                if (perintah == '/start') {
                    bot.sendMessage(msg.chat.id, 'Selamat datang '+msg.from.first_name+' '+msg.from.last_name)
                }
                if (perintah == '/monitor') {
                    let list_server = []
                    let collectServer = new Promise((resolve,reject)=>{
                        for (let i = 0; i < config.server.length; i++) {
                            list_server.push([{text:config.server[i].name, callback_data:config.server[i].slug}])                        
                        }
                        resolve('done')
                    })
                    
                    collectServer.then((done)=>{
                        if(done){
                            var options = {
                                reply_markup: JSON.stringify({
                                  inline_keyboard: list_server
                                })
                            }
                            bot.sendMessage(msg.chat.id, 'Silahkan pilih server : ',options)
                        }
                    })
                }
            }
            
        })
    } 
})

bot.on('callback_query', function onCallbackQuery(server_choosen) {
    let collectServer = new Promise((resolve,reject)=>{
        for (let i = 0; i < config.server.length; i++) {
            if(config.server[i].slug == server_choosen.data){
                resolve(config.server[i])
            }                   
        }
    })
    
    collectServer.then((server)=>{
        request({
            url:'http://'+server.host+':'+server.port+'/sysinfo',
            headers:{
                'Authorization': 'Bearer '+ config.server_key
            }
        },(err, res, body)=>{
            let result = JSON.parse(body)
            result = result.data
            let data = ''
            data += "Platform: "+ result.platform + "\n"
            data += "Number of CPUs: " +result.num_cpu + "\n"
            data += "CPU Usage (%) : " + result.cpu_usage + "\n"
            data += "Total Memory: " + result.total_mem + "\n"
            data += "Free Memory: " + result.free_mem + "\n"
            data += "Free Memory (%): " + result.free_mem_percent + "\n"
            data += "System Uptime: " + result.uptime + "\n"
            bot.sendMessage(server_choosen.message.chat.id, data,{parse_mode: "HTML"})
        })
    })
})

app.use(bodyParser.json())
app.listen(config.port, function () {
    console.log('app listening at port %s', config.port)
})