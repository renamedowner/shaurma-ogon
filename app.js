/**
 * ШАУРМА ОГОНЬ 🔥 (Краснодар) — Главный скрипт доставки и интерфейса
 * Интерактивные билеты, карусель, корзина с опциями, чекаут без багов
 */

class ShaurmaOgonApp {
  constructor() {
    this.dishes = [];
    this.filteredDishes = [];
    this.cart = []; // [{ id, dishId, title, price, qty, image, optionsText }]
    this.activeCategory = 'all';
    this.activeFilter = null; // 'hits' | 'cheese' | 'spicy'
    this.searchQuery = '';
    
    this.currentSlide = 0;
    this.totalSlides = 3;
    this.slideInterval = null;

    this.appliedPromo = null; // { code: 'OGON15', discountPercent: 15 } or 'DELIVERY_FREE' or 'FREE_MORS'
    this.deliveryType = 'delivery'; // 'delivery' | 'pickup'
    this.freeDeliveryThreshold = 800;
    this.standardDeliveryCost = 150;

    this.activeModalDish = null;
    this.modalDishOptions = {
      size: null,
      lavash: null,
      spicy: null,
      toppings: []
    };
    this.modalQty = 1;

    this.init();
  }

  async init() {
    await this.loadDishes();
    this.bindDOM();
    this.initCarousel();
    this.renderDishes();
    this.renderUpsell();
    this.updateCartUI();
  }

  async loadDishes() {
    try {
      const res = await fetch('dishes.json');
      if (res.ok) {
        this.dishes = await res.json();
      } else {
        throw new Error('Fetch failed');
      }
    } catch (e) {
      console.warn('Using embedded fallback dishes data', e);
      this.dishes = this.getFallbackDishes();
    }
    this.filteredDishes = [...this.dishes];
  }

  getFallbackDishes() {
    return [
      {
        id: 'sh-ogon-std',
        category: 'shaurma',
        isPopular: true,
        badge: 'ХИТ 🔥',
        title: 'Шаурма «Огонь» Фирменная',
        weight: '450 г',
        price: 420,
        priceOld: 470,
        descr: 'Сочное куриное бедро на гриле, свежие томаты, огурцы, маринованный лучок, хрустящая капуста и секретный авторский соус «Огонь» с легким дымком.',
        image: 'https://static.tildacdn.com/stor3861-6362-4233-b335-613162366433/0dfad8941d12a3435df9de64f434d493.jpg',
        options: {
          sizes: [{ name: 'Стандарт 450г', price: 0 }, { name: 'XXL Великан 600г', price: 90 }],
          lavash: [{ name: 'Классический лаваш', price: 0 }, { name: 'Сырный лаваш', price: 30 }],
          spicy: [{ name: '🍃 Не острая', price: 0 }, { name: '🌶️ Пикантная', price: 0 }, { name: '🔥 Огонь (Халапеньо)', price: 0 }],
          toppings: [{ name: 'Халапеньо', price: 55 }, { name: 'Двойное мясо', price: 160 }, { name: 'Сыр Чеддер', price: 65 }]
        }
      },
      {
        id: 'sh-cheese-boom',
        category: 'shaurma',
        isPopular: true,
        badge: 'СЫРНЫЙ БУМ 🧀',
        title: 'Шаурма Сырный Огонь',
        weight: '480 г',
        price: 460,
        priceOld: 510,
        descr: 'В золотистом сырном лаваше с двойной порцией тянущейся моцареллы, сливочным чеддером, нежным куриным филе и чесночно-сырным соусом.',
        image: 'https://static.tildacdn.com/stor3538-3336-4131-a134-653331633035/54a09444ea1c144b0e2280fb561c1358.jpg',
        options: {
          sizes: [{ name: 'Стандарт 480г', price: 0 }, { name: 'XXL Великан 620г', price: 90 }],
          lavash: [{ name: 'Сырный лаваш', price: 0 }, { name: 'Классический лаваш', price: 0 }],
          spicy: [{ name: '🍃 Сливочно-мягкая', price: 0 }, { name: '🌶️ С перчиком', price: 0 }],
          toppings: [{ name: 'Двойной сыр', price: 65 }, { name: 'Двойное мясо', price: 160 }]
        }
      },
      {
        id: 'sh-classic',
        category: 'shaurma',
        isPopular: false,
        badge: 'КЛАССИКА',
        title: 'Шаурма Классическая',
        weight: '400 г',
        price: 390,
        priceOld: 430,
        descr: 'Проверенный временем рецепт: хрустящий лаваш, мясо с вертела, спелые томаты, свежий огурчик и классический соус на белом йогурте и специях.',
        image: 'https://static.tildacdn.com/stor6431-3137-4166-b661-393839383561/a18bd2f788dd844fccb37ebbe4957483.jpg',
        options: {
          sizes: [{ name: 'Стандарт 400г', price: 0 }, { name: 'Большая 520г', price: 80 }],
          lavash: [{ name: 'Классический', price: 0 }, { name: 'Сырный', price: 30 }]
        }
      },
      {
        id: 'gyros-plate',
        category: 'gyros_rolls',
        isPopular: true,
        badge: 'ТОП СЫТНО 🥙',
        title: 'Гирос на тарелке с фри',
        weight: '550 г',
        price: 620,
        priceOld: 680,
        descr: 'Щедрая порция: горячее мясо с вертела, горка золотистого картофеля фри, греческий соус дзадзики, томаты, красный лук и теплая пита.',
        image: 'https://static.tildacdn.com/stor6539-3639-4935-a138-646338373632/f45453952f42ce1810e1d026c2ea4766.jpg',
        options: {}
      },
      {
        id: 'fries-crispy',
        category: 'snacks',
        isPopular: false,
        badge: 'ХРУСТ',
        title: 'Картофель Фри Золотистый',
        weight: '150 г',
        price: 190,
        priceOld: 220,
        descr: 'Идеально хрустящая корочка снаружи и нежная картофельная мякоть внутри, присыпанная морской солью.',
        image: 'https://static.tildacdn.com/stor6531-6332-4635-b536-343036376631/1ee9d3b37227fa24f2b3ec0e958c8422.jpg',
        options: {}
      },
      {
        id: 'sauce-fire',
        category: 'sauces',
        isPopular: true,
        badge: 'ФИРМЕННЫЙ 🔥',
        title: 'Соус «Огонь» Халапеньо BBQ',
        weight: '50 г',
        price: 55,
        priceOld: 70,
        descr: 'Секретный соус нашего шефа: томатный барбекю на углях с пикантным перчиком халапеньо и копченой паприкой.',
        image: 'img/sauce-salsa.jpg',
        options: {}
      },
      {
        id: 'mors-currant',
        category: 'drinks',
        isPopular: true,
        badge: 'ДОМАШНИЙ 🫐',
        title: 'Морс Черносмородиновый',
        weight: '500 мл',
        price: 130,
        priceOld: 160,
        descr: 'Сварен нами из цельных ягод черной смородины с легкой кислинкой. Без консервантов и красителей.',
        image: 'https://static.tildacdn.com/stor3064-3039-4562-a665-656332353362/e1896fb3d4b992eeae925a1e1ef160a3.jpg',
        options: {}
      },
      {
        id: 'combo-ogon-flame',
        category: 'combos',
        isPopular: true,
        badge: 'ВЫГОДА -22% 🔥',
        title: 'Комбо «Огонь-Хит»',
        weight: '750 г',
        price: 650,
        priceOld: 830,
        descr: 'Фирменная шаурма «Огонь» (450г) + порция золотистого картофеля фри (150г) + домашний смородиновый морс (500мл). Сытный комбо с ощутимой экономией!',
        image: 'https://static.tildacdn.com/stor3861-6362-4233-b335-613162366433/0dfad8941d12a3435df9de64f434d493.jpg',
        options: {}
      }
    ];
  }

  bindDOM() {
    // Поиск
    const searchInput = document.getElementById('menuSearchInput');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.trim().toLowerCase();
        if (clearSearchBtn) clearSearchBtn.style.display = this.searchQuery ? 'flex' : 'none';
        this.applyFilterAndSearch();
      });
    }
    if (clearSearchBtn) {
      clearSearchBtn.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        this.searchQuery = '';
        clearSearchBtn.style.display = 'none';
        this.applyFilterAndSearch();
      });
    }
    const resetSearchBtn = document.getElementById('btnResetSearch');
    if (resetSearchBtn) {
      resetSearchBtn.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        this.searchQuery = '';
        if (clearSearchBtn) clearSearchBtn.style.display = 'none';
        this.activeCategory = 'all';
        this.activeFilter = null;
        this.updateCategoryTabs();
        this.applyFilterAndSearch();
      });
    }

    // Категории
    const catPills = document.querySelectorAll('.cat-pill');
    catPills.forEach(pill => {
      pill.addEventListener('click', () => {
        catPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.activeCategory = pill.getAttribute('data-cat');
        this.applyFilterAndSearch();
      });
    });

    // Фильтры
    const filterChips = document.querySelectorAll('.filter-chip');
    filterChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const filterVal = chip.getAttribute('data-filter');
        if (this.activeFilter === filterVal) {
          this.activeFilter = null;
          chip.classList.remove('active');
        } else {
          filterChips.forEach(c => c.classList.remove('active'));
          chip.classList.add('active');
          this.activeFilter = filterVal;
        }
        this.applyFilterAndSearch();
      });
    });

    // Корзина Drawer
    const headerCartBtn = document.getElementById('headerCartBtn');
    const closeCartBtn = document.getElementById('closeCartBtn');
    const cartOverlay = document.getElementById('cartOverlay');
    const btnReturnToMenu = document.getElementById('btnReturnToMenu');

    if (headerCartBtn) headerCartBtn.addEventListener('click', () => this.openCart());
    if (closeCartBtn) closeCartBtn.addEventListener('click', () => this.closeCart());
    if (cartOverlay) {
      cartOverlay.addEventListener('click', (e) => {
        if (e.target === cartOverlay) this.closeCart();
      });
    }
    if (btnReturnToMenu) btnReturnToMenu.addEventListener('click', () => this.closeCart());

    const clearCartBtn = document.getElementById('clearCartBtn');
    if (clearCartBtn) {
      clearCartBtn.addEventListener('click', () => {
        this.cart = [];
        this.updateCartUI();
        this.renderDishes();
        this.showToast('Корзина очищена');
      });
    }

    // Переключатель типа доставки (доставка / самовывоз)
    const btnTypeDelivery = document.getElementById('btnTypeDelivery');
    const btnTypePickup = document.getElementById('btnTypePickup');
    if (btnTypeDelivery) {
      btnTypeDelivery.addEventListener('click', () => this.setDeliveryType('delivery'));
    }
    if (btnTypePickup) {
      btnTypePickup.addEventListener('click', () => this.setDeliveryType('pickup'));
    }

    // Промокод в корзине
    const btnApplyPromo = document.getElementById('btnApplyPromo');
    const promoInput = document.getElementById('promoCodeInput');
    if (btnApplyPromo && promoInput) {
      btnApplyPromo.addEventListener('click', () => {
        const val = promoInput.value.trim().toUpperCase();
        if (val) this.applyPromoCode(val);
      });
      promoInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const val = promoInput.value.trim().toUpperCase();
          if (val) this.applyPromoCode(val);
        }
      });
    }

    const btnRemovePromo = document.getElementById('btnRemovePromo');
    if (btnRemovePromo) {
      btnRemovePromo.addEventListener('click', () => {
        this.appliedPromo = null;
        this.updateCartUI();
        this.showToast('Промокод отменен');
      });
    }

    // Кнопка оформления заказа в корзине
    const btnCheckoutPrimary = document.getElementById('btnCheckoutPrimary');
    if (btnCheckoutPrimary) {
      btnCheckoutPrimary.addEventListener('click', () => this.openCheckout());
    }

    // Модалка чекаута закрытие
    const closeCheckoutModalBtn = document.getElementById('closeCheckoutModalBtn');
    const checkoutModalBackdrop = document.getElementById('checkoutModalBackdrop');
    if (closeCheckoutModalBtn) {
      closeCheckoutModalBtn.addEventListener('click', () => this.closeCheckout());
    }
    if (checkoutModalBackdrop) {
      checkoutModalBackdrop.addEventListener('click', (e) => {
        if (e.target === checkoutModalBackdrop) this.closeCheckout();
      });
    }

    // Модалка кастомизатора блюда
    const closeDishModalBtn = document.getElementById('closeDishModalBtn');
    const dishModalBackdrop = document.getElementById('dishModalBackdrop');
    if (closeDishModalBtn) {
      closeDishModalBtn.addEventListener('click', () => this.closeDishModal());
    }
    if (dishModalBackdrop) {
      dishModalBackdrop.addEventListener('click', (e) => {
        if (e.target === dishModalBackdrop) this.closeDishModal();
      });
    }

    const modalQtyMinus = document.getElementById('modalQtyMinus');
    const modalQtyPlus = document.getElementById('modalQtyPlus');
    if (modalQtyMinus) {
      modalQtyMinus.addEventListener('click', () => {
        if (this.modalQty > 1) {
          this.modalQty--;
          document.getElementById('modalQtyVal').textContent = this.modalQty;
          this.recalcModalPrice();
        }
      });
    }
    if (modalQtyPlus) {
      modalQtyPlus.addEventListener('click', () => {
        this.modalQty++;
        document.getElementById('modalQtyVal').textContent = this.modalQty;
        this.recalcModalPrice();
      });
    }

    const modalAddToCartBtn = document.getElementById('modalAddToCartBtn');
    if (modalAddToCartBtn) {
      modalAddToCartBtn.addEventListener('click', () => this.addConfiguredDishToCart());
    }

    // Кнопки промо-билетов в карусели (интерактивный клик по билетам)
    const ticketDelivery = document.getElementById('ticketDelivery');
    if (ticketDelivery) {
      ticketDelivery.addEventListener('click', () => {
        this.applyPromoCode('DELIVERY_FREE');
      });
    }
    const ticketDiscount = document.getElementById('ticketDiscount');
    if (ticketDiscount) {
      ticketDiscount.addEventListener('click', () => {
        this.applyPromoCode('OGON15');
      });
    }
    const ticketGift = document.getElementById('ticketGift');
    if (ticketGift) {
      ticketGift.addEventListener('click', () => {
        this.applyPromoCode('FREE_MORS');
      });
    }

    // Модалки навигации
    const openPromosBtn = document.getElementById('openPromosBtn');
    if (openPromosBtn) openPromosBtn.addEventListener('click', () => this.openPromosModal());

    const openDeliveryModalBtn = document.getElementById('openDeliveryModalBtn');
    if (openDeliveryModalBtn) openDeliveryModalBtn.addEventListener('click', () => this.openDeliveryModal());

    const openReviewsBtn = document.getElementById('openReviewsBtn');
    if (openReviewsBtn) {
      openReviewsBtn.addEventListener('click', () => {
        const target = document.querySelector('.yandex-reviews-section');
        if (target) target.scrollIntoView({ behavior: 'smooth' });
      });
    }
  }

  /* ==========================================================================
     КАРУСЕЛЬ БАННЕРОВ (С КНОПКАМИ И ИНДИКАТОРАМИ)
     ========================================================================== */
  initCarousel() {
    const prevBtn = document.getElementById('promoPrevBtn');
    const nextBtn = document.getElementById('promoNextBtn');
    const dots = document.querySelectorAll('.dot-pill');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        this.prevSlide();
        this.restartSlideInterval();
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        this.nextSlide();
        this.restartSlideInterval();
      });
    }

    dots.forEach(dot => {
      dot.addEventListener('click', () => {
        const idx = parseInt(dot.getAttribute('data-index'), 10);
        this.goToSlide(idx);
        this.restartSlideInterval();
      });
    });

    this.startSlideInterval();

    const wrapper = document.querySelector('.promo-carousel-wrapper');
    if (wrapper) {
      wrapper.addEventListener('mouseenter', () => clearInterval(this.slideInterval));
      wrapper.addEventListener('mouseleave', () => this.startSlideInterval());
    }
  }

  goToSlide(idx) {
    this.currentSlide = (idx + this.totalSlides) % this.totalSlides;
    const track = document.getElementById('promoTrack');
    if (track) {
      track.style.transform = `translateX(-${this.currentSlide * 100}%)`;
    }
    const dots = document.querySelectorAll('.dot-pill');
    dots.forEach((d, i) => {
      d.classList.toggle('active', i === this.currentSlide);
    });
  }

  nextSlide() {
    this.goToSlide(this.currentSlide + 1);
  }

  prevSlide() {
    this.goToSlide(this.currentSlide - 1);
  }

  startSlideInterval() {
    clearInterval(this.slideInterval);
    this.slideInterval = setInterval(() => this.nextSlide(), 6000);
  }

  restartSlideInterval() {
    this.startSlideInterval();
  }

  /* ==========================================================================
     ФИЛЬТРАЦИЯ И ОТРИСОВКА БЛЮД
     ========================================================================== */
  applyFilterAndSearch() {
    this.filteredDishes = this.dishes.filter(dish => {
      // Категория
      if (this.activeCategory !== 'all' && dish.category !== this.activeCategory) {
        return false;
      }
      // Поиск
      if (this.searchQuery) {
        const titleMatch = dish.title.toLowerCase().includes(this.searchQuery);
        const descrMatch = dish.descr && dish.descr.toLowerCase().includes(this.searchQuery);
        if (!titleMatch && !descrMatch) return false;
      }
      // Фильтры
      if (this.activeFilter === 'hits' && !dish.isPopular) return false;
      if (this.activeFilter === 'cheese' && !dish.title.toLowerCase().includes('сыр') && !dish.badge?.includes('СЫР')) return false;
      if (this.activeFilter === 'spicy' && !dish.title.toLowerCase().includes('огонь') && !dish.badge?.includes('🔥')) return false;

      return true;
    });

    this.renderDishes();
  }

  updateCategoryTabs() {
    const catPills = document.querySelectorAll('.cat-pill');
    catPills.forEach(p => {
      p.classList.toggle('active', p.getAttribute('data-cat') === this.activeCategory);
    });
  }

  renderDishes() {
    const grid = document.getElementById('dishesGrid');
    const emptyState = document.getElementById('emptySearchState');
    const countLabel = document.getElementById('dishesCountLabel');
    const catTitle = document.getElementById('currentCategoryTitle');

    if (!grid) return;

    if (countLabel) countLabel.textContent = `${this.filteredDishes.length} позиций`;

    const catNames = {
      all: 'Все блюда меню',
      shaurma: 'Шаурма на открытом огне',
      gyros_rolls: 'Гирос, Скепасти и Роллы',
      snacks: 'Горячие хрустящие закуски',
      sauces: 'Фирменные соусы',
      drinks: 'Напитки и домашние морсы',
      combos: 'Выгодные комбо-наборы'
    };
    if (catTitle) catTitle.textContent = catNames[this.activeCategory] || 'Меню';

    if (this.filteredDishes.length === 0) {
      grid.innerHTML = '';
      if (emptyState) emptyState.style.display = 'block';
      return;
    } else {
      if (emptyState) emptyState.style.display = 'none';
    }

    grid.innerHTML = this.filteredDishes.map(dish => {
      const inCartQty = this.getDishTotalQtyInCart(dish.id);
      const hasOptions = dish.options && (dish.options.lavash || dish.options.sizes || dish.options.toppings);

      return `
        <article class="dish-card" data-id="${dish.id}">
          <div class="dish-thumb-wrap" onclick="app.openDishModal('${dish.id}')">
            <img src="${dish.image}" alt="${dish.title}" class="dish-img" loading="lazy" onerror="this.src='img/hero-cover.jpg'">
            ${dish.badge ? `<span class="dish-badge-pill">${dish.badge}</span>` : ''}
          </div>
          <div class="dish-content">
            <div class="dish-meta-line">
              <span>${dish.weight || ''}</span>
              ${dish.isPopular ? '<span style="color:#FF7043; font-weight:800;">Хит продаж</span>' : ''}
            </div>
            <h3 class="dish-title" onclick="app.openDishModal('${dish.id}')">${dish.title}</h3>
            <p class="dish-descr">${dish.descr || ''}</p>
            <div class="dish-footer-row">
              <div class="price-block">
                <span class="current-price">${dish.price} ₽</span>
                ${dish.priceOld ? `<span class="old-price">${dish.priceOld} ₽</span>` : ''}
              </div>
              <div class="dish-action-slot">
                ${inCartQty > 0 ? `
                  <div class="card-qty-control">
                    <button class="card-qty-btn" onclick="app.decrementDishInCart('${dish.id}')">−</button>
                    <span class="card-qty-val">${inCartQty}</span>
                    <button class="card-qty-btn" onclick="app.incrementDishInCart('${dish.id}')">+</button>
                  </div>
                ` : `
                  <button class="btn-add-to-cart" onclick="${hasOptions ? `app.openDishModal('${dish.id}')` : `app.quickAddToCart('${dish.id}')`}">
                    <span>+ В корзину</span>
                  </button>
                `}
              </div>
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  renderUpsell() {
    const upsellSlider = document.getElementById('upsellSlider');
    if (!upsellSlider) return;

    // Рекомендуем соусы и фри
    const upsellItems = this.dishes.filter(d => d.category === 'sauces' || d.id === 'fries-crispy').slice(0, 5);
    upsellSlider.innerHTML = upsellItems.map(item => `
      <div class="upsell-mini-chip" onclick="app.quickAddToCart('${item.id}')" title="Добавить в корзину">
        <img src="${item.image}" alt="${item.title}" class="upsell-chip-img" onerror="this.src='img/sauce-salsa.jpg'">
        <div>
          <span class="upsell-chip-title">${item.title}</span>
          <span class="upsell-chip-price">+${item.price} ₽</span>
        </div>
      </div>
    `).join('');
  }

  /* ==========================================================================
     МОДАЛЬНОЕ ОКНО КАСТОМИЗАЦИИ БЛЮДА
     ========================================================================== */
  openDishModal(dishId) {
    const dish = this.dishes.find(d => d.id === dishId);
    if (!dish) return;

    this.activeModalDish = dish;
    this.modalQty = 1;
    this.modalDishOptions = {
      size: dish.options?.sizes ? dish.options.sizes[0] : null,
      lavash: dish.options?.lavash ? dish.options.lavash[0] : null,
      spicy: dish.options?.spicy ? dish.options.spicy[0] : null,
      toppings: []
    };

    document.getElementById('modalDishImg').src = dish.image;
    document.getElementById('modalDishBadge').textContent = dish.badge || 'ОГОНЬ 🔥';
    document.getElementById('modalDishTitle').textContent = dish.title;
    document.getElementById('modalDishWeight').textContent = dish.weight || '';
    document.getElementById('modalDishDescr').textContent = dish.descr || '';
    document.getElementById('modalQtyVal').textContent = '1';

    // Размеры
    const groupSize = document.getElementById('groupSize');
    const sizeChips = document.getElementById('modalSizeChips');
    if (dish.options?.sizes && dish.options.sizes.length > 0) {
      groupSize.style.display = 'block';
      sizeChips.innerHTML = dish.options.sizes.map((s, idx) => `
        <button class="chip-option-btn ${idx === 0 ? 'active' : ''}" onclick="app.selectModalSize(${idx})">
          ${s.name} ${s.price ? `(+${s.price} ₽)` : ''}
        </button>
      `).join('');
    } else {
      groupSize.style.display = 'none';
    }

    // Лаваш
    const groupLavash = document.getElementById('groupLavash');
    const lavashChips = document.getElementById('modalLavashChips');
    if (dish.options?.lavash && dish.options.lavash.length > 0) {
      groupLavash.style.display = 'block';
      lavashChips.innerHTML = dish.options.lavash.map((l, idx) => `
        <button class="chip-option-btn ${idx === 0 ? 'active' : ''}" onclick="app.selectModalLavash(${idx})">
          ${l.name} ${l.price ? `(+${l.price} ₽)` : ''}
        </button>
      `).join('');
    } else {
      groupLavash.style.display = 'none';
    }

    // Острота
    const groupSpicy = document.getElementById('groupSpicy');
    const spicyChips = document.getElementById('modalSpicyChips');
    if (dish.options?.spicy && dish.options.spicy.length > 0) {
      groupSpicy.style.display = 'block';
      spicyChips.innerHTML = dish.options.spicy.map((sp, idx) => `
        <button class="chip-option-btn ${idx === 0 ? 'active' : ''}" onclick="app.selectModalSpicy(${idx})">
          ${sp.name}
        </button>
      `).join('');
    } else {
      groupSpicy.style.display = 'none';
    }

    // Топпинги
    const groupToppings = document.getElementById('groupToppings');
    const toppingsList = document.getElementById('modalToppingsList');
    if (dish.options?.toppings && dish.options.toppings.length > 0) {
      groupToppings.style.display = 'block';
      toppingsList.innerHTML = dish.options.toppings.map((top, idx) => `
        <label class="topping-check-label" id="toppingLabel_${idx}">
          <span>${top.name}</span>
          <strong>+${top.price} ₽</strong>
          <input type="checkbox" style="display:none" onchange="app.toggleModalTopping(${idx}, this.checked)">
        </label>
      `).join('');
    } else {
      groupToppings.style.display = 'none';
    }

    this.recalcModalPrice();
    document.getElementById('dishModalBackdrop').classList.add('active');
  }

  selectModalSize(idx) {
    this.modalDishOptions.size = this.activeModalDish.options.sizes[idx];
    const buttons = document.querySelectorAll('#modalSizeChips .chip-option-btn');
    buttons.forEach((b, i) => b.classList.toggle('active', i === idx));
    this.recalcModalPrice();
  }

  selectModalLavash(idx) {
    this.modalDishOptions.lavash = this.activeModalDish.options.lavash[idx];
    const buttons = document.querySelectorAll('#modalLavashChips .chip-option-btn');
    buttons.forEach((b, i) => b.classList.toggle('active', i === idx));
    this.recalcModalPrice();
  }

  selectModalSpicy(idx) {
    this.modalDishOptions.spicy = this.activeModalDish.options.spicy[idx];
    const buttons = document.querySelectorAll('#modalSpicyChips .chip-option-btn');
    buttons.forEach((b, i) => b.classList.toggle('active', i === idx));
    this.recalcModalPrice();
  }

  toggleModalTopping(idx, isChecked) {
    const topping = this.activeModalDish.options.toppings[idx];
    const label = document.getElementById(`toppingLabel_${idx}`);
    if (label) label.classList.toggle('active', isChecked);

    if (isChecked) {
      this.modalDishOptions.toppings.push(topping);
    } else {
      this.modalDishOptions.toppings = this.modalDishOptions.toppings.filter(t => t.name !== topping.name);
    }
    this.recalcModalPrice();
  }

  recalcModalPrice() {
    if (!this.activeModalDish) return;
    let singlePrice = this.activeModalDish.price;
    if (this.modalDishOptions.size?.price) singlePrice += this.modalDishOptions.size.price;
    if (this.modalDishOptions.lavash?.price) singlePrice += this.modalDishOptions.lavash.price;
    if (this.modalDishOptions.toppings?.length > 0) {
      this.modalDishOptions.toppings.forEach(t => singlePrice += (t.price || 0));
    }

    const total = singlePrice * this.modalQty;
    const priceEl = document.getElementById('modalFinalPrice');
    if (priceEl) priceEl.textContent = `${total} ₽`;
    return singlePrice;
  }

  addConfiguredDishToCart() {
    if (!this.activeModalDish) return;

    const unitPrice = this.recalcModalPrice();
    const optionsParts = [];
    if (this.modalDishOptions.size) optionsParts.push(this.modalDishOptions.size.name);
    if (this.modalDishOptions.lavash) optionsParts.push(this.modalDishOptions.lavash.name);
    if (this.modalDishOptions.spicy) optionsParts.push(this.modalDishOptions.spicy.name);
    if (this.modalDishOptions.toppings.length > 0) {
      optionsParts.push('+' + this.modalDishOptions.toppings.map(t => t.name).join(', '));
    }

    const optionsText = optionsParts.join(' • ');
    const cartItemId = `${this.activeModalDish.id}_${optionsText.replace(/\s+/g, '_')}`;

    const existingIndex = this.cart.findIndex(i => i.id === cartItemId);
    if (existingIndex > -1) {
      this.cart[existingIndex].qty += this.modalQty;
    } else {
      this.cart.push({
        id: cartItemId,
        dishId: this.activeModalDish.id,
        title: this.activeModalDish.title,
        price: unitPrice,
        qty: this.modalQty,
        image: this.activeModalDish.image,
        optionsText: optionsText
      });
    }

    const addedTitle = this.activeModalDish.title;
    const addedQty = this.modalQty;
    this.closeDishModal();
    this.updateCartUI();
    this.renderDishes();
    this.showToast(`Добавлено: ${addedTitle} (${addedQty} шт)`);
  }

  closeDishModal() {
    document.getElementById('dishModalBackdrop').classList.remove('active');
    this.activeModalDish = null;
  }

  /* ==========================================================================
     КОРЗИНА: ОПЕРАЦИИ И РАСЧЕТЫ
     ========================================================================== */
  quickAddToCart(dishId) {
    const dish = this.dishes.find(d => d.id === dishId);
    if (!dish) return;

    const cartItemId = `${dish.id}_default`;
    const existing = this.cart.find(i => i.id === cartItemId);
    if (existing) {
      existing.qty++;
    } else {
      this.cart.push({
        id: cartItemId,
        dishId: dish.id,
        title: dish.title,
        price: dish.price,
        qty: 1,
        image: dish.image,
        optionsText: ''
      });
    }

    this.updateCartUI();
    this.renderDishes();
    this.showToast(`Добавлено: ${dish.title}`);
  }

  getDishTotalQtyInCart(dishId) {
    return this.cart
      .filter(i => i.dishId === dishId)
      .reduce((sum, item) => sum + item.qty, 0);
  }

  incrementDishInCart(dishId) {
    const item = this.cart.find(i => i.dishId === dishId);
    if (item) {
      item.qty++;
      this.updateCartUI();
      this.renderDishes();
    }
  }

  decrementDishInCart(dishId) {
    const item = this.cart.find(i => i.dishId === dishId);
    if (item) {
      item.qty--;
      if (item.qty <= 0) {
        this.cart = this.cart.filter(i => i !== item);
      }
      this.updateCartUI();
      this.renderDishes();
    }
  }

  changeItemQty(cartItemId, delta) {
    const item = this.cart.find(i => i.id === cartItemId);
    if (item) {
      item.qty += delta;
      if (item.qty <= 0) {
        this.cart = this.cart.filter(i => i.id !== cartItemId);
      }
      this.updateCartUI();
      this.renderDishes();
    }
  }

  setDeliveryType(type) {
    this.deliveryType = type;
    document.getElementById('btnTypeDelivery').classList.toggle('active', type === 'delivery');
    document.getElementById('btnTypePickup').classList.toggle('active', type === 'pickup');

    const addressBlock = document.getElementById('addressFieldsBlock');
    if (addressBlock) {
      addressBlock.style.display = type === 'pickup' ? 'none' : 'block';
    }

    this.updateCartUI();
    this.showToast(type === 'pickup' ? 'Выбран самовывоз со скидкой 10%!' : 'Выбрана доставка курьером');
  }

  applyPromoCode(code) {
    const cleanCode = code.toUpperCase().trim();

    if (cleanCode === 'DELIVERY_FREE') {
      this.appliedPromo = { code: 'DELIVERY_FREE', text: 'Бесплатная доставка 0 ₽', discountDelivery: true };
      this.showToast('🛵 Промокод на бесплатную доставку применен!');
    } else if (cleanCode === 'OGON15') {
      this.appliedPromo = { code: 'OGON15', text: 'Скидка 15% на всё меню', percent: 15 };
      this.showToast('🔥 Промокод OGON15: Скидка -15% применена!');
    } else if (cleanCode === 'FREE_MORS') {
      this.appliedPromo = { code: 'FREE_MORS', text: 'Подарок: Домашний морс', gift: true };
      // Добавим подарочный морс в корзину
      const giftItem = {
        id: 'gift_mors',
        dishId: 'mors-currant',
        title: 'Морс Черносмородиновый (Подарок 🎁)',
        price: 0,
        qty: 1,
        image: 'https://static.tildacdn.com/stor3064-3039-4562-a665-656332353362/e1896fb3d4b992eeae925a1e1ef160a3.jpg',
        optionsText: 'Подарок по акции'
      };
      if (!this.cart.some(i => i.id === 'gift_mors')) {
        this.cart.push(giftItem);
      }
      this.showToast('🥤 Черносмородиновый морс 0.5 л добавлен в подарок!');
    } else {
      this.showToast('Неверный промокод. Попробуйте OGON15');
      return;
    }

    this.updateCartUI();
    this.closePromosModal();
  }

  updateCartUI() {
    const subtotal = this.cart.reduce((sum, i) => sum + (i.price * i.qty), 0);
    const totalCount = this.cart.reduce((sum, i) => sum + i.qty, 0);

    // Скидки
    let discount = 0;
    if (this.deliveryType === 'pickup') {
      discount += Math.round(subtotal * 0.10); // 10% самовывоз
    }
    if (this.appliedPromo?.percent) {
      discount += Math.round(subtotal * (this.appliedPromo.percent / 100));
    }

    // Доставка
    let deliveryCost = 0;
    if (this.deliveryType === 'delivery') {
      if (this.appliedPromo?.discountDelivery || subtotal >= this.freeDeliveryThreshold || subtotal === 0) {
        deliveryCost = 0;
      } else {
        deliveryCost = this.standardDeliveryCost;
      }
    }

    const total = Math.max(0, subtotal - discount + deliveryCost);

    // Шапка и мобильный бар
    const headerCartTotal = document.getElementById('headerCartTotal');
    const cartCountBadge = document.getElementById('cartCountBadge');
    const mobCartBubble = document.getElementById('mobCartBubble');
    const mobCartSum = document.getElementById('mobCartSum');
    const drawerCartCount = document.getElementById('drawerCartCount');

    if (headerCartTotal) headerCartTotal.textContent = `${total} ₽`;
    if (cartCountBadge) cartCountBadge.textContent = totalCount;
    if (mobCartBubble) mobCartBubble.textContent = totalCount;
    if (mobCartSum) mobCartSum.textContent = `${total} ₽`;
    if (drawerCartCount) drawerCartCount.textContent = `(${totalCount})`;

    // Прогресс бесплатной доставки
    const progressLabel = document.getElementById('deliveryProgressLabel');
    const progressPercent = document.getElementById('deliveryProgressPercent');
    const progressBarFill = document.getElementById('deliveryProgressBarFill');

    if (this.deliveryType === 'pickup') {
      if (progressLabel) progressLabel.textContent = '🎉 Самовывоз: скидка -10% уже включена!';
      if (progressPercent) progressPercent.textContent = '100%';
      if (progressBarFill) progressBarFill.style.width = '100%';
    } else if (subtotal >= this.freeDeliveryThreshold || this.appliedPromo?.discountDelivery) {
      if (progressLabel) progressLabel.textContent = '🎉 У вас БЕСПЛАТНАЯ доставка!';
      if (progressPercent) progressPercent.textContent = '100%';
      if (progressBarFill) progressBarFill.style.width = '100%';
    } else {
      const remaining = this.freeDeliveryThreshold - subtotal;
      const pct = Math.min(100, Math.round((subtotal / this.freeDeliveryThreshold) * 100));
      if (progressLabel) progressLabel.textContent = `До бесплатной доставки: ${remaining} ₽`;
      if (progressPercent) progressPercent.textContent = `${pct}%`;
      if (progressBarFill) progressBarFill.style.width = `${pct}%`;
    }

    // Список позиций в drawer
    const cartItemsList = document.getElementById('cartItemsList');
    const emptyCartView = document.getElementById('emptyCartView');
    const checkoutBtn = document.getElementById('btnCheckoutPrimary');

    if (this.cart.length === 0) {
      if (cartItemsList) cartItemsList.style.display = 'none';
      if (emptyCartView) emptyCartView.style.display = 'block';
      if (checkoutBtn) checkoutBtn.disabled = true;
    } else {
      if (cartItemsList) {
        cartItemsList.style.display = 'flex';
        cartItemsList.innerHTML = this.cart.map(item => `
          <div class="cart-item-card">
            <img src="${item.image}" alt="${item.title}" class="cart-item-img" onerror="this.src='img/hero-cover.jpg'">
            <div class="cart-item-info">
              <h4 class="cart-item-title">${item.title}</h4>
              ${item.optionsText ? `<div class="cart-item-options">${item.optionsText}</div>` : ''}
              <div class="cart-item-price">${item.price * item.qty} ₽</div>
            </div>
            <div class="cart-item-controls">
              <button class="card-qty-btn" onclick="app.changeItemQty('${item.id}', -1)">−</button>
              <span class="card-qty-val">${item.qty}</span>
              <button class="card-qty-btn" onclick="app.changeItemQty('${item.id}', 1)">+</button>
            </div>
          </div>
        `).join('');
      }
      if (emptyCartView) emptyCartView.style.display = 'none';
      if (checkoutBtn) checkoutBtn.disabled = false;
    }

    // Промокод плашка
    const appliedPromoTag = document.getElementById('appliedPromoTag');
    const appliedPromoText = document.getElementById('appliedPromoText');
    if (this.appliedPromo) {
      if (appliedPromoTag) appliedPromoTag.style.display = 'flex';
      if (appliedPromoText) appliedPromoText.textContent = this.appliedPromo.text;
    } else {
      if (appliedPromoTag) appliedPromoTag.style.display = 'none';
    }

    // Итоги
    const summarySubtotal = document.getElementById('summarySubtotal');
    const discountLine = document.getElementById('discountSummaryLine');
    const summaryDiscount = document.getElementById('summaryDiscount');
    const summaryDeliveryCost = document.getElementById('summaryDeliveryCost');
    const summaryTotal = document.getElementById('summaryTotal');
    const btnCheckoutSum = document.getElementById('btnCheckoutSum');

    if (summarySubtotal) summarySubtotal.textContent = `${subtotal} ₽`;

    if (discount > 0) {
      if (discountLine) discountLine.style.display = 'flex';
      if (summaryDiscount) summaryDiscount.textContent = `-${discount} ₽`;
    } else {
      if (discountLine) discountLine.style.display = 'none';
    }

    if (summaryDeliveryCost) {
      summaryDeliveryCost.textContent = deliveryCost === 0 ? '0 ₽ (Бесплатно)' : `${deliveryCost} ₽`;
    }

    if (summaryTotal) summaryTotal.textContent = `${total} ₽`;
    if (btnCheckoutSum) btnCheckoutSum.textContent = `${total} ₽`;
  }

  openCart() {
    document.getElementById('cartOverlay').classList.add('active');
  }

  closeCart() {
    document.getElementById('cartOverlay').classList.remove('active');
  }

  /* ==========================================================================
     ОФОРМЛЕНИЕ ЗАКАЗА (ZERO-BUG CHECKOUT)
     ========================================================================== */
  openCheckout() {
    if (this.cart.length === 0) {
      this.showToast('Сначала добавьте блюда в корзину');
      return;
    }
    this.closeCart();
    const finalTotal = document.getElementById('summaryTotal').textContent;
    document.getElementById('checkoutFinalTotal').textContent = finalTotal;
    document.getElementById('checkoutModalBackdrop').classList.add('active');
  }

  closeCheckout() {
    document.getElementById('checkoutModalBackdrop').classList.remove('active');
  }

  submitOrder() {
    const name = document.getElementById('orderName').value.trim();
    const phone = document.getElementById('orderPhone').value.trim();
    const street = document.getElementById('orderStreet')?.value.trim() || 'Самовывоз';
    const apt = document.getElementById('orderApt')?.value.trim() || '';
    const payment = document.querySelector('input[name="paymentMethod"]:checked')?.value || 'cash_terminal';

    const orderNum = Math.floor(1000 + Math.random() * 9000);
    const finalTotal = document.getElementById('summaryTotal').textContent;

    // Закрываем чекаут
    this.closeCheckout();

    // Заполняем модалку успеха
    document.getElementById('successOrderNumber').textContent = `Заказ #${orderNum}`;
    document.getElementById('successAddress').textContent = this.deliveryType === 'pickup' 
      ? 'Самовывоз: ул. Московская, 130' 
      : `${street}${apt ? ', кв. ' + apt : ''}`;
    document.getElementById('successTotal').textContent = finalTotal;
    document.getElementById('successPayment').textContent = payment === 'cash_terminal' 
      ? 'Курьеру при получении' 
      : 'СБП / Онлайн перевод';

    // Открываем модалку успеха
    document.getElementById('successModalBackdrop').classList.add('active');

    // Очищаем корзину
    this.cart = [];
    this.appliedPromo = null;
    this.updateCartUI();
    this.renderDishes();

    this.showToast('🔥 Заказ успешно передан поварам!');
  }

  closeSuccessModal() {
    document.getElementById('successModalBackdrop').classList.remove('active');
  }

  /* ==========================================================================
     ИНФОРМАЦИОННЫЕ МОДАЛКИ
     ========================================================================== */
  openPromosModal() {
    document.getElementById('promosModalBackdrop').classList.add('active');
  }
  closePromosModal() {
    document.getElementById('promosModalBackdrop').classList.remove('active');
  }

  openDeliveryModal() {
    document.getElementById('deliveryModalBackdrop').classList.add('active');
  }
  closeDeliveryModal() {
    document.getElementById('deliveryModalBackdrop').classList.remove('active');
  }

  openAboutModal() {
    document.getElementById('aboutModalBackdrop').classList.add('active');
  }
  closeAboutModal() {
    document.getElementById('aboutModalBackdrop').classList.remove('active');
  }

  openLegalModal() {
    document.getElementById('legalModalBackdrop').classList.add('active');
  }
  closeLegalModal() {
    document.getElementById('legalModalBackdrop').classList.remove('active');
  }

  /* ==========================================================================
     ВСПЛЫВАЮЩИЕ УВЕДОМЛЕНИЯ (TOASTS)
     ========================================================================== */
  showToast(message) {
    const container = document.getElementById('toastsContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast success';
    toast.innerHTML = `<span>🔥</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }
}

// Запуск приложения
const app = new ShaurmaOgonApp();
window.app = app;
