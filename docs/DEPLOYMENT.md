# Размещение версии 1.0

Подготовлен кандидат 1.0.0-rc.1. Условие выпуска 1.0: студенты и преподаватели регистрируются на рабочем HTTPS-адресе, получают письмо, подтверждают e-mail, администратор проверяет принадлежность, данные и вход сохраняются после перезапуска. Статическая демонстрация не считается выполнением этого условия.

## GitHub и сервер

Репозиторий хранит исходники и запускает проверки. GitHub Pages не выполняет Node.js/PostgreSQL и не является сервером аккаунтов: [официальное описание Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages).

В `.github/workflows/verify.yml` подготовлены lint, unit-тесты, production build и HTTP-проверки на PostgreSQL 17. Workflow не разворачивает сайт и не получает секретов сервера. У нового репозитория предпочтительно оставить доступ Private, пока владелец не выберет иную аудиторию.

Для размещения приготовлен независимый от провайдера Docker Compose. Понадобятся Linux-сервер с Docker Compose, домен с A/AAAA-записями на него, открытые 80/443 и SMTP для отправки писем. Платные ресурсы не создаются автоматически. Бесплатный Render не подходит к текущему SMTP-сценарию: его free web services блокируют SMTP-порты; ограничения перечислены в [документации Render](https://render.com/docs/free).

## Первый запуск на выбранном сервере

Скопируйте `deploy/production.env.example` в `.env.production`. Укажите PORTAL_DOMAIN (только имя хоста), случайный POSTGRES_PASSWORD из hex-символов, SMTP_HOST/PORT/FROM и, если требуется авторизация, SMTP_USER/PASSWORD. Не добавляйте заполненный файл в Git. DNS должен указывать на сервер до выпуска HTTPS-сертификата.

```sh
docker compose --env-file .env.production -f compose.production.yaml up -d --build
docker compose --env-file .env.production -f compose.production.yaml ps
```

Порядок: PostgreSQL готов → миграции и seed → проверка соединения с БД и SMTP без отправки письма → Node.js → Caddy с автоматическим HTTPS. БД сохраняется в именованном volume. Внешние порты БД и Node не публикуются, Caddy перезаписывает X-Real-IP. Если конфигурация или миграция не прошла, сервер аккаунтов не запускается. Проверка `/api/health/` возвращает только ok/unavailable, без реквизитов БД.

Первый администратор сначала регистрируется и подтверждает e-mail. Затем оператор выполняет:

```sh
docker compose --env-file .env.production -f compose.production.yaml run --rm operator pnpm accounts:admin operator@your-domain.ru --grant-admin
```

Адрес заменить на подтверждённый аккаунт уполномоченного сотрудника. Команда не создаёт пароль, журналирует назначение и закрывает прежние сессии. После повторного входа доступна `/admin/accounts`.

## Обновления и резервные копии

Перед обновлением сохраните backup PostgreSQL вне сервера. Например, на Linux:

```sh
umask 077
docker compose --env-file .env.production -f compose.production.yaml exec -T db pg_dump -U portal -d portal -Fc > portal-backup.dump
docker compose --env-file .env.production -f compose.production.yaml build app migrate operator
docker compose --env-file .env.production -f compose.production.yaml run --rm migrate
docker compose --env-file .env.production -f compose.production.yaml up -d app proxy
```

Не используйте `down -v`: это удаляет volume базы. Не восстанавливайте backup поверх рабочего сервера без отдельного плана и проверки. Backups содержат персональные данные; храните их с ограниченным доступом. Запланированная задача резервного копирования не создана автоматически.

## Проверка перед объявлением 1.0

Нужен реальный тест на опубликованном адресе: регистрация двух ролей, доставка письма, подтверждение администратором, повторный вход, сохранение устройства, восстановление пароля, чужие данные недоступны, перезапуск приложения не теряет аккаунты. Проверка SMTP соединения не гарантирует принятие отправителя и фактическую доставку письма.

В текущей среде пройдены локальные проверки. Владелец создал репозиторий [VirtualRealm/RGUPS](https://github.com/VirtualRealm/RGUPS). Docker и рабочий сервер ещё не запускались; серверный хостинг и SMTP предстоит подключить. Документ не является подтверждением публикации.
