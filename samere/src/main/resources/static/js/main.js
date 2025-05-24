let allProducts = [];
let cart = [];

async function loadProducts() {
  try {
    const res = await fetch("http://localhost:8080/api/products");
    const products = await res.json();
    allProducts = products;

    renderFilteredProducts();
  } catch (err) {
    console.error("Erro ao carregar produtos:", err);
  }
}

document
  .getElementById("brandSearch")
  .addEventListener("input", renderFilteredProducts);

document.getElementById("fabricFilter").addEventListener("change", (e) => {
  const val = e.target.value.toLowerCase();

  if (val === "100% algodão" || val === "algodao") {
    document
      .getElementById("algodaoSection")
      .scrollIntoView({ behavior: "smooth" });
  } else if (val === "cotton pima" || val === "pima") {
    document
      .getElementById("pimaSection")
      .scrollIntoView({ behavior: "smooth" });
  } else {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
});

function renderFilteredProducts() {
  const brandQuery = document.getElementById("brandSearch").value.toLowerCase();

  const algodaoSection = document.getElementById("algodaoSection");
  const pimaSection = document.getElementById("pimaSection");

  algodaoSection.innerHTML = "";
  pimaSection.innerHTML = "";

  allProducts.forEach((product) => {
    const brand = (product.brand || "").toLowerCase();
    const fabric = (product.fabric || "").toLowerCase();

    if (brandQuery && !brand.includes(brandQuery)) return;

    if (fabric.includes("100% algodão")) {
      createProductCard(product, algodaoSection);
    } else if (fabric.includes("cotton pima")) {
      createProductCard(product, pimaSection);
    }
  });
}

function createProductCard(product, grid) {
  const card = document.createElement("div");
  card.className = "product-card";
  const outOfStockClass = product.outOfStock ? "out-of-stock" : "";
  const outOfStockLabel = product.outOfStock
    ? '<div class="out-of-stock-label">ESGOTADO</div>'
    : "";

  const validImages = (product.imagePaths || []).filter(
    (path) => path && path.trim() !== ""
  );
  const baseUrl = "http://localhost:8080/";

  card.innerHTML = `
    <!-- IMAGEM NO TOPO -->
    <div class="product-image ${outOfStockClass}">
      ${outOfStockLabel}
      <div class="carousel-container">
        ${
          validImages.length > 0
            ? validImages
                .map(
                  (img, i) =>
                    `<img src="${baseUrl + img}" alt="${product.brand} imagem ${
                      i + 1
                    }" class="carousel-image" style="${
                      i === 0 ? "display:block;" : "display:none;"
                    }" />`
                )
                .join("")
            : `<div class="no-image">Sem imagem</div>`
        }
      </div>
    </div>

    <!-- INFORMAÇÕES E OPÇÕES EMBAIXO -->
    <div class="product-info">
      <div class="product-brand">${product.brand}</div>
      <div class="product-fabric">${product.fabric}</div>
      ${
        product.category
          ? `<div class="product-category">${product.category}</div>`
          : ""
      }

      ${
        !product.outOfStock
          ? `
      <div class="selectors">
        <select class="color-select">
          <option value="">Selecione a cor</option>
          ${(product.colors || [])
            .map((color) => `<option value="${color}">${color}</option>`)
            .join("")}
        </select>
        <select class="size-select">
          <option value="">Selecione o tamanho</option>
          ${(product.sizes || [])
            .map((size) => `<option value="${size}">${size}</option>`)
            .join("")}
        </select>
        <button class="add-to-cart" data-product-id="${
          product.id
        }">Adicionar ao carrinho</button>
      </div>`
          : ""
      }
    </div>
  `;

  if (validImages.length > 1) {
    let currentIndex = 0;
    const images = card.querySelectorAll(".carousel-image");

    setInterval(() => {
      images[currentIndex].style.display = "none";
      currentIndex = (currentIndex + 1) % images.length;
      images[currentIndex].style.display = "block";
    }, 3000);
  }

  if (!product.outOfStock) {
    const productImage = card.querySelector(".product-image");
    productImage.style.cursor = "pointer";
    productImage.addEventListener("click", () => openProductModal(product));

    const addButton = card.querySelector(".add-to-cart");
    addButton.addEventListener("click", function () {
      const color = card.querySelector(".color-select").value;
      const size = card.querySelector(".size-select").value;

      if (!color || !size) {
        Swal.fire({
          title: "Selecione as opções",
          text: "Por favor, selecione a cor e o tamanho",
          icon: "warning",
        });
        return;
      }

      addToCart(product, color, size);

      const originalText = this.textContent;
      this.textContent = "✔ Adicionado";
      this.style.backgroundColor = "#2ecc71";

      setTimeout(() => {
        this.textContent = originalText;
        this.style.backgroundColor = "";
      }, 1500);
    });
  }

  grid.appendChild(card);
}

function openProductModal(product) {
  const modal = document.getElementById("productModal");

  const mainImage = document.getElementById("modalMainImage");
  const thumbnailsContainer = document.getElementById("modalThumbnails");
  const colorsContainer = document.getElementById("modalColorsContainer");
  const sizesContainer = document.getElementById("modalSizesContainer");
  const addButton = document.getElementById("modalAddToCart");

  document.getElementById("modalBrand").textContent = product.brand;
  document.getElementById("modalFabric").textContent = product.fabric;
  document.getElementById("modalCategory").textContent = product.category || "";

  const validImages = (product.imagePaths || []).filter((p) => p);
  const baseUrl = "http://localhost:8080/";

  thumbnailsContainer.innerHTML = "";

  if (validImages.length > 0) {
    mainImage.src = baseUrl + validImages[0];
    mainImage.alt = `${product.brand} imagem principal`;

    validImages.forEach((imgPath, i) => {
      const thumb = document.createElement("img");
      thumb.src = baseUrl + imgPath;
      thumb.alt = `Miniatura ${i + 1}`;
      if (i === 0) thumb.classList.add("selected");

      thumb.style.cursor = "pointer";
      thumb.style.width = "60px";
      thumb.style.height = "60px";
      thumb.style.objectFit = "cover";
      thumb.style.marginRight = "8px";
      thumb.style.border = i === 0 ? "2px solid #333" : "2px solid transparent";

      thumb.addEventListener("click", () => {
        mainImage.src = thumb.src;

        thumbnailsContainer.querySelectorAll("img").forEach((img) => {
          img.classList.remove("selected");
          img.style.border = "2px solid transparent";
        });
        thumb.classList.add("selected");
        thumb.style.border = "2px solid #333";
      });

      thumbnailsContainer.appendChild(thumb);
    });
  } else {
    mainImage.src = "";
    thumbnailsContainer.innerHTML = "<div>Sem imagem</div>";
  }

  colorsContainer.innerHTML = "";
  (product.colors || []).forEach((color) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = color;
    btn.className = "option-btn";
    btn.style.marginRight = "8px";

    btn.onclick = () => {
      colorsContainer
        .querySelectorAll("button")
        .forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
    };

    colorsContainer.appendChild(btn);
  });

  sizesContainer.innerHTML = "";
  (product.sizes || []).forEach((size) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = size;
    btn.className = "option-btn";
    btn.style.marginRight = "8px";

    btn.onclick = () => {
      sizesContainer
        .querySelectorAll("button")
        .forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
    };

    sizesContainer.appendChild(btn);
  });

  addButton.onclick = () => {
    const selectedColorBtn = colorsContainer.querySelector("button.selected");
    const selectedSizeBtn = sizesContainer.querySelector("button.selected");

    if (!selectedColorBtn || !selectedSizeBtn) {
      Swal.fire("Selecione as opções", "Escolha a cor e tamanho", "warning");
      return;
    }

    const selectedColor = selectedColorBtn.textContent;
    const selectedSize = selectedSizeBtn.textContent;

    addToCart(product, selectedColor, selectedSize);

    addButton.textContent = "✔ Adicionado";
    addButton.style.backgroundColor = "#2ecc71";
    setTimeout(() => {
      addButton.textContent = "Adicionar ao carrinho";
      addButton.style.backgroundColor = "";
    }, 1500);
  };

  modal.style.display = "flex";
}

function addToCart(product, color, size) {
  const existingItemIndex = cart.findIndex(
    (item) =>
      item.product.id === product.id &&
      item.color === color &&
      item.size === size
  );

  if (existingItemIndex !== -1) {
    cart[existingItemIndex].quantity += 1;
  } else {
    cart.push({
      product: product,
      color: color,
      size: size,
      quantity: 1,
    });
  }

  updateCartUI();
}

function updateCartUI() {
  const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
  document.getElementById("cartCount").textContent = totalItems;
  document.getElementById("cartTotalItems").textContent = totalItems;

  const cartContent = document.getElementById("cartContent");
  const minOrderMessage = document.getElementById("minOrderMessage");
  const checkoutBtn = document.getElementById("checkoutBtn");

  if (cart.length === 0) {
    cartContent.innerHTML =
      '<div class="empty-cart">Seu carrinho está vazio</div>';
    minOrderMessage.innerHTML =
      "Pedido mínimo: 5 camisas<br>Adicione mais itens ao carrinho";
    checkoutBtn.disabled = true;
    return;
  }

  let html = "";
  const MIN_ITEMS = 5;
  const remainingItems = Math.max(0, MIN_ITEMS - totalItems);

  if (remainingItems > 0) {
    minOrderMessage.innerHTML = `Pedido mínimo: 5 camisas<br>Você tem ${totalItems} itens no carrinho, faltam ${remainingItems} para finalizar`;
    checkoutBtn.disabled = true;
  } else {
    minOrderMessage.innerHTML = "✅ Pedido pode ser finalizado!";
    checkoutBtn.disabled = false;
  }

  cart.forEach((item, index) => {
    const baseUrl = "http://localhost:8080/";
    const firstImage =
      item.product.imagePaths && item.product.imagePaths.length > 0
        ? baseUrl + item.product.imagePaths[0]
        : "";

    html += `
              <div class="cart-item">
                <img src="${firstImage}" alt="${item.product.brand}" class="cart-item-image" onerror="this.src='https://via.placeholder.com/80'">
                <div class="cart-item-details">
                  <div class="cart-item-title">${item.product.brand}</div>
                  <div class="cart-item-meta">
                    Cor: ${item.color} | Tamanho: ${item.size}
                  </div>
                  <div class="cart-item-meta">Quantidade: ${item.quantity}</div>
                  <div class="cart-item-actions">
                    <button class="quantity-btn" onclick="updateQuantity(${index}, -1)">-</button>
                    <input type="text" class="quantity-input" value="${item.quantity}" readonly>
                    <button class="quantity-btn" onclick="updateQuantity(${index}, 1)">+</button>
                    <span class="remove-item" onclick="removeItem(${index})">Remover</span>
                  </div>
                </div>
              </div>
            `;
  });

  cartContent.innerHTML = html;
}

function updateQuantity(index, change) {
  const newQuantity = cart[index].quantity + change;

  if (newQuantity < 1) {
    removeItem(index);
  } else {
    cart[index].quantity = newQuantity;
    updateCartUI();
  }
}

function removeItem(index) {
  cart.splice(index, 1);
  updateCartUI();
}

function generateWhatsAppMessage() {
  let message = "Olá, gostaria de fazer um pedido com os seguintes itens:\n\n";

  cart.forEach((item) => {
    const fabric = item.product.fabric || "Tipo de malha não informado";
    message += `- ${item.product.brand} (${item.color}, ${item.size}) - ${fabric} - Quantidade: ${item.quantity}\n`;
  });

  message += `\nTotal de itens: ${cart.reduce(
    (total, item) => total + item.quantity,
    0
  )}`;

  return encodeURIComponent(message);
}

document.getElementById("cartIcon").addEventListener("click", function () {
  document.getElementById("cartModal").style.display = "block";
});

document.getElementById("closeCart").addEventListener("click", function () {
  document.getElementById("cartModal").style.display = "none";
});

document.getElementById("checkoutBtn").addEventListener("click", function () {
  const totalItems = cart.reduce((total, item) => total + item.quantity, 0);

  if (totalItems < 5) {
    Swal.fire(
      "Pedido mínimo não atingido",
      "O pedido mínimo é de 5 camisas. Adicione mais itens ao carrinho.",
      "warning"
    );
    return;
  }

  const phoneNumber = "5532999430189";
  const message = generateWhatsAppMessage();
  window.open(`https://wa.me/${phoneNumber}?text=${message}`, "_blank");
});

document.getElementById("closeModal").onclick = () => {
  document.getElementById("productModal").style.display = "none";
};

loadProducts();

function saveCartToLocalStorage() {
  localStorage.setItem("shoppingCart", JSON.stringify(cart));
}

function addToCart(product, color, size) {
  const existingItemIndex = cart.findIndex(
    (item) =>
      item.product.id === product.id &&
      item.color === color &&
      item.size === size
  );

  if (existingItemIndex !== -1) {
    cart[existingItemIndex].quantity += 1;
  } else {
    cart.push({
      product: product,
      color: color,
      size: size,
      quantity: 1,
    });
  }

  saveCartToLocalStorage();
  updateCartUI();
}

function updateQuantity(index, change) {
  const newQuantity = cart[index].quantity + change;
  if (newQuantity < 1) {
    removeItem(index);
  } else {
    cart[index].quantity = newQuantity;
    saveCartToLocalStorage();
    updateCartUI();
  }
}

function removeItem(index) {
  cart.splice(index, 1);
  saveCartToLocalStorage();
  updateCartUI();
}

function loadCartFromLocalStorage() {
  const savedCart = localStorage.getItem("shoppingCart");
  if (savedCart) {
    cart = JSON.parse(savedCart);
    updateCartUI();
  }
}

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    document.querySelector(this.getAttribute("href")).scrollIntoView({
      behavior: "smooth",
    });
  });
});

document.addEventListener("DOMContentLoaded", function () {
  const benefitsSlider = {
    init() {
      this.slider = document.getElementById("benefitsSlider");
      this.prevBtn = document.getElementById("prevBtn");
      this.nextBtn = document.getElementById("nextBtn");
      this.dots = document.querySelectorAll(".dot");
      this.slides = document.querySelectorAll(".benefit-card");
      this.currentIndex = 0;
      this.autoPlayInterval = null;
      this.autoPlayDelay = 5000;

      this.setupEventListeners();
      this.showSlide(this.currentIndex);
      this.startAutoPlay();
    },

    setupEventListeners() {
      this.prevBtn.addEventListener("click", () => this.prevSlide());
      this.nextBtn.addEventListener("click", () => this.nextSlide());

      this.dots.forEach((dot, index) => {
        dot.addEventListener("click", () => this.goToSlide(index));
      });

      this.slider.addEventListener("mouseenter", () => this.stopAutoPlay());
      this.slider.addEventListener("mouseleave", () => this.startAutoPlay());
    },

    showSlide(index) {
      this.slider.style.transform = `translateX(-${index * 100}%)`;
      this.dots.forEach((dot) => dot.classList.remove("active"));
      this.dots[index].classList.add("active");

      this.currentIndex = index;
    },

    prevSlide() {
      const newIndex =
        (this.currentIndex - 1 + this.slides.length) % this.slides.length;
      this.showSlide(newIndex);
      this.restartAutoPlay();
    },

    nextSlide() {
      const newIndex = (this.currentIndex + 1) % this.slides.length;
      this.showSlide(newIndex);
      this.restartAutoPlay();
    },

    goToSlide(index) {
      this.showSlide(index);
      this.restartAutoPlay();
    },

    startAutoPlay() {
      this.stopAutoPlay();
      this.autoPlayInterval = setInterval(
        () => this.nextSlide(),
        this.autoPlayDelay
      );
    },

    stopAutoPlay() {
      if (this.autoPlayInterval) {
        clearInterval(this.autoPlayInterval);
        this.autoPlayInterval = null;
      }
    },

    restartAutoPlay() {
      this.stopAutoPlay();
      this.startAutoPlay();
    },
  };

  benefitsSlider.init();
});

loadCartFromLocalStorage();
loadProducts();
