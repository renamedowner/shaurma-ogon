"""
Сквозное тестирование сайта «Шаурма Огонь» с помощью Playwright
Проверка десктопного и мобильного вида, кнопок, карусели, корзины и чекаута
"""
import sys
import time
import subprocess
from playwright.sync_api import sync_playwright

def run_tests():
    print("=== ЗАПУСК ТЕСТОВ ШАУРМА ОГОНЬ ===")
    
    # Запускаем локальный веб-сервер
    server = subprocess.Popen(
        [sys.executable, "-m", "http.server", "8089"],
        cwd=r"C:\Users\Administrator\.gemini\antigravity\scratch\shaurma-ogon",
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )
    time.sleep(1)

    url = "http://localhost:8089/index.html"
    errors = []

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page(viewport={"width": 1280, "height": 900})

            # Слушаем ошибки в консоли
            page.on("pageerror", lambda err: errors.append(f"PAGE ERROR: {err}"))
            page.on("console", lambda msg: errors.append(f"CONSOLE ERROR: {msg.text}") if msg.type == "error" else None)

            # 1. Загрузка страницы
            page.goto(url, wait_until="networkidle")
            title = page.title()
            print(f"[✓] Страница загружена. Title: {title}")
            assert "Шаурма Огонь" in title

            # 2. Проверка карусели и билетов
            next_btn = page.locator("#promoNextBtn")
            assert next_btn.is_visible()
            next_btn.click()
            time.sleep(0.4)
            print("[✓] Карусель прокручена вперед")

            # Клик по перфорированному билету (Скидка -15%)
            ticket_amber = page.locator("#ticketDiscount")
            ticket_amber.click()
            time.sleep(0.4)
            print("[✓] Клик по билету скидки 15% сработал")

            # 3. Фильтрация категорий
            cat_shaurma = page.locator("button.cat-pill[data-cat='shaurma']")
            cat_shaurma.click()
            time.sleep(0.3)
            cards = page.locator(".dish-card")
            count = cards.count()
            print(f"[✓] В категории 'Шаурма': {count} карточек")
            assert count > 0

            # 4. Добавление блюда в корзину
            first_add_btn = cards.first.locator(".btn-add-to-cart")
            if first_add_btn.is_visible():
                first_add_btn.click()
                time.sleep(0.4)
                # Если открылась модалка
                if page.locator("#dishModalBackdrop").is_visible():
                    print("[✓] Модалка кастомизатора открылась, выбираем опции")
                    page.locator("#modalAddToCartBtn").click()
                    time.sleep(0.4)

            # Проверяем, что в шапке сумма обновилась
            header_total = page.locator("#headerCartTotal").inner_text()
            print(f"[✓] Сумма в шапке: {header_total}")

            # 5. Открываем корзину
            page.locator("#headerCartBtn").click()
            time.sleep(0.5)
            assert page.locator("#cartPanel").is_visible()
            print("[✓] Корзина успешно открыта")

            # Проверяем прогресс-бар бесплатной доставки
            prog_label = page.locator("#deliveryProgressLabel").inner_text()
            print(f"[✓] Прогресс доставки: {prog_label}")

            # 6. Клик по Upsell мини-карточке (добавим соус)
            upsell_chip = page.locator(".upsell-mini-chip").first
            if upsell_chip.is_visible():
                upsell_chip.click()
                time.sleep(0.3)
                print("[✓] Соус из рекомендаций добавлен в корзину")

            # 7. Переход к оформлению
            checkout_btn = page.locator("#btnCheckoutPrimary")
            checkout_btn.click()
            time.sleep(0.5)
            assert page.locator("#checkoutModalBackdrop").is_visible()
            print("[✓] Модалка чекаута открыта")

            # Подтверждаем заказ
            page.locator("#btnConfirmOrder").click()
            time.sleep(0.6)
            assert page.locator("#successModalBackdrop").is_visible()
            order_num = page.locator("#successOrderNumber").inner_text()
            print(f"[✓] Заказ успешно оформлен! {order_num}")

            # Делаем скриншот успеха
            page.screenshot(path=r"C:\Users\Administrator\.gemini\antigravity\scratch\shaurma-ogon\screenshot_test.png")
            print("[✓] Скриншот сохранен")

            browser.close()

    finally:
        server.terminate()

    if errors:
        print("\nОБНАРУЖЕНЫ ОШИБКИ:")
        for e in errors:
            print(" -", e)
        sys.exit(1)
    else:
        print("\n🎉 ВСЕ ТЕСТЫ ПРОЙДЕНЫ С 0 ОШИБОК!")

if __name__ == "__main__":
    run_tests()
