import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const scriptContent = `
(function() {
  const API_URL = '${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}';
  const API_KEY = window.CHAT_WIDGET_API_KEY || 'default-api-key';

  const widgetHTML = \`
    <div id="chat-widget-container" style="
      position: fixed;
      bottom: 20px;
      left: 20px;
      width: 350px;
      height: 500px;
      background: white;
      border-radius: 10px;
      box-shadow: 0 5px 40px rgba(0,0,0,0.16);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto;
      z-index: 9999;
      display: flex;
      flex-direction: column;
    ">
      <div style="
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 20px;
        border-radius: 10px 10px 0 0;
        text-align: center;
      ">
        <h3 style="margin: 0; font-size: 18px;">سامانه چت</h3>
      </div>
      
      <div id="chat-messages" style="
        flex: 1;
        overflow-y: auto;
        padding: 15px;
        background: #f5f5f5;
      "></div>
      
      <div style="
        padding: 15px;
        border-top: 1px solid #ddd;
        background: white;
        border-radius: 0 0 10px 10px;
      ">
        <input type="text" 
          id="chat-input" 
          placeholder="پیام خود را بنویسید..." 
          style="
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 5px;
            outline: none;
            margin-bottom: 10px;
            box-sizing: border-box;
          "
        />
        <button id="chat-send" style="
          width: 100%;
          padding: 10px;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-weight: bold;
        ">ارسال</button>
      </div>
    </div>
  \`;

  document.body.insertAdjacentHTML('beforeend', widgetHTML);

  const messagesContainer = document.getElementById('chat-messages');
  const input = document.getElementById('chat-input');
  const sendBtn = document.getElementById('chat-send');

  // دریافت پیام‌های موجود
  async function loadMessages() {
    try {
      const res = await fetch(API_URL + '/api/widget/messages?limit=20', {
        headers: { 'x-api-key': API_KEY }
      });
      const data = await res.json();
      
      if (data.success) {
        messagesContainer.innerHTML = '';
        data.data.messages.forEach(msg => {
          const msgEl = document.createElement('div');
          msgEl.style.cssText = 'margin-bottom: 10px; padding: 10px; background: white; border-radius: 5px;';
          msgEl.innerHTML = \`
            <strong>\${msg.user.name || msg.user.email}</strong><br>
            \${msg.content || ''}
            \${msg.imageUrl ? '<br><img src="' + msg.imageUrl + '" style="max-width: 100%; margin-top: 5px; border-radius: 3px;">' : ''}
          \`;
          messagesContainer.appendChild(msgEl);
        });
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  }

  // ارسال پیام
  sendBtn.addEventListener('click', async () => {
    const content = input.value.trim();
    if (!content) return;

    try {
      const guestEmail = prompt('ایمیل خود را وارد کنید:');
      if (!guestEmail) return;

      const res = await fetch(API_URL + '/api/widget/messages', {
        method: 'POST',
        headers: {
          'x-api-key': API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content, guestEmail })
      });

      if (res.ok) {
        input.value = '';
        loadMessages();
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  });

  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendBtn.click();
  });

  // بارگیری پیام‌ها هر 3 ثانیه
  loadMessages();
  setInterval(loadMessages, 3000);
})();
  `;

  return new NextResponse(scriptContent, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'no-cache',
    },
  });
}
