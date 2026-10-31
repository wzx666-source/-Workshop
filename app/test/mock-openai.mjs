import http from 'node:http';

const payload = {
  title: '接口联调结果',
  summary: '这是 mock OpenAI 服务返回的结构，用来验证 live 链路。',
  items: [
    { label: '联调项一', detail: '验证 OpenAI 兼容协议的请求与解析。', suggestion: '保留这条作为联调证据。' },
    { label: '联调项二', detail: '验证 JSON 代码块剥离。', suggestion: '返回内容故意包了 ```json 围栏。' },
  ],
  next_action: '确认并导出',
};

const server = http.createServer((req, res) => {
  let body = '';
  req.on('data', (chunk) => { body += chunk; });
  req.on('end', () => {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({
      choices: [
        { message: { role: 'assistant', content: '```json\n' + JSON.stringify(payload) + '\n```' } },
      ],
    }));
  });
});

server.listen(5180, '127.0.0.1', () => console.log('mock-openai ready on 5180'));
