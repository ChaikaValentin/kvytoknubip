🎬Kvytok

Навчальний проєкт — вебсервіс для купівлі квитків у кіно. Робили як практику: 
обираєш фільм і сеанс, тицяєш на місця в залі, «оплачуєш» і отримуєш квиток з QR-кодом.

Демо паблік версія - https://kvytoknubip-production.up.railway.app

Афіша з фільтрами за датою та жанром
Сторінка фільму із сеансами по кінотеатрах
Вибір місць на схемі залу (бронь тримається 10 хвилин)
Демо-оплата + промокод `KVYTOK10`
Квитки з QR-кодом («Мої квитки» за email)
Проста адмінка `/admin` пароль admin

Стек

Front: React + Vite, React Router, звичайний CSS
Back: Node.js + Express
БД: SQLite (better-sqlite3)
Деплой: Docker + Railway

Запустити локально
Треба Node.js 18+ (краще 20).
```bash
git clone https://github.com/ChaikaValentin/kvytoknubip.git
cd kvytoknubip
npm install
npm run seed
npm run dev
