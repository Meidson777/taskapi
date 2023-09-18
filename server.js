const TelegramBot = require('node-telegram-bot-api');
const dotenv = require('dotenv');
const conn = require('./connection');

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;

const bot = new TelegramBot(token, { polling: true });

bot.on('callback_query', (callbackQuery) => {

    const chatId = callbackQuery.message.chat.id;

    const data = callbackQuery.data;

    if (data.startsWith('concluir_')) {
        const taskId = data.substring(9); // Remove o "concluir_"

        const sql = 'UPDATE tasks SET ie_status=1 WHERE id=?';
        const values = [taskId];

        conn.query(sql, values, (err, result) => {
            if (err) {
                console.error('Error updating record:', err);
                return;
            }
            console.log('Record updated:', result);
            getTasks();

        });

    }

});

bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const messageText = msg.text.toLowerCase(); // Converte a mensagem para minúsculas

    // Verifica se a mensagem está no formato "tarefa: nome da tarefa"
    if (messageText.startsWith('tarefa: ')) {

        const taskName = messageText.substring(8); // Remove "tarefa: " do início
        // console.log(taskName);
        const sql = 'INSERT INTO tasks (nm_task, ds_desc, data_deadline, ie_status) VALUES (?, ?, ?, ?)';
        const values = [taskName, taskName, new Date(), 0];

        conn.query(sql, values, (err, result) => {

            if (err) {
                console.error('Error creating record:', err);
                return;
            }
            console.log('Record created:', result);
            bot.sendMessage(chatId, 'Tarefa Adicionada com sucesso !');
            getTasks();

        });

    }
});

const intervaloDe24Horas = 24 * 60 * 60 * 1000;

// Função para enviar mensagens do bot a cada 5 segundos
async function getTasks() {
    try {
        // // Chat ID para onde você deseja enviar a mensagem
        const chatId = '-1001984485255';
        //   bot.sendMessage(chatId, 'Bot Iniciado');

        const sql = 'SELECT * FROM tasks WHERE ie_status = 0';

        conn.query(sql, (err, results) => {
            if (err) {
                console.error('Error reading records:', err);
                return;
            }

            if (results.length > 0) {


                const keyboard = {
                    inline_keyboard: results.map((row) => [
                        { text: `Finalizar: ${row.nm_task}`, callback_data: `concluir_${row.id}` },
                    ]),
                };

                const messageOptions = {
                    chat_id: chatId,
                    text: 'Lista de Tarefas:',
                    reply_markup: JSON.stringify(keyboard),
                };


                bot.sendMessage(chatId, 'Temos tarefas pendentes\n\ Selecione uma para finalizar', messageOptions);

            } else {
                bot.sendMessage(chatId, 'Todas as tarefas estão finzalidas\n\Para inserir uma nova tarefa digite\n\Tarefa: nome tarefa');
            }

        });


        // Aguarda 5 segundos antes de enviar a próxima mensagem
        setTimeout(getTasks, intervaloDe24Horas); // A cada 24 horas

    } catch (error) {
        console.error('Erro ao enviar mensagem do Telegram:', error);

        // Tentar novamente após 5 segundos em caso de erro
        setTimeout(getTasks, intervaloDe24Horas); // A cada 24 horas
    }
}

// Inicie a função de envio de mensagens
getTasks();


console.log('Bot iniciado.');
