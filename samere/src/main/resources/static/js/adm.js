const colorsContainer = document.getElementById("colorsContainer");
const sizesContainer = document.getElementById("sizesContainer");
const productsGrid = document.getElementById("productsGrid");
const searchInput = document.getElementById("searchProduct");
const editModal = document.getElementById("editModal");
const closeEditModalBtn = document.getElementById("closeEditModal");
const editColorsContainer = document.getElementById("editColorsContainer");
const editSizesContainer = document.getElementById("editSizesContainer");

let currentProductImages = [];
let removedImages = [];

function showAlert(message, type = "default", duration = 5000) {
  const alert = document.getElementById("customAlert");
  const alertMessage = alert.querySelector(".alert-message");
  const closeBtn = alert.querySelector(".alert-close-btn");

  alert.className = "custom-alert";
  alertMessage.textContent = message;
  if (type !== "default") alert.classList.add(type);
  alert.classList.add("show");

  const closeAlert = () => {
    alert.classList.remove("show");
    setTimeout(() => {
      alert.className = "custom-alert";
    }, 300);
  };

  closeBtn.onclick = closeAlert;

  if (duration > 0) {
    setTimeout(closeAlert, duration);
  }
}

function createTag(text, container) {
  const tag = document.createElement("span");
  tag.textContent = text;
  tag.classList.add("tag");
  tag.onclick = () => tag.remove();
  container.appendChild(tag);
}

function clearEditTags() {
  editColorsContainer.innerHTML = "";
  editSizesContainer.innerHTML = "";
}

function navigateCarousel(carouselId, direction) {
  const carousel = document.getElementById(carouselId);
  const images = carousel.querySelectorAll(".carousel-image");
  let currentIndex = 0;

  images.forEach((img, index) => {
    if (img.classList.contains("active")) {
      currentIndex = index;
      img.classList.remove("active");
    }
  });

  let newIndex = currentIndex + direction;
  if (newIndex >= images.length) newIndex = 0;
  if (newIndex < 0) newIndex = images.length - 1;

  images[newIndex].classList.add("active");
}

document.getElementById("addColorBtn").addEventListener("click", () => {
  const val = document.getElementById("colorInput").value.trim();
  if (val) {
    createTag(val, colorsContainer);
    document.getElementById("colorInput").value = "";
  }
});

document.getElementById("addSizeBtn").addEventListener("click", () => {
  const val = document.getElementById("sizeInput").value.trim();
  if (val) {
    createTag(val, sizesContainer);
    document.getElementById("sizeInput").value = "";
  }
});

document
  .getElementById("productImages")
  .addEventListener("change", function (e) {
    const previewContainer = document.getElementById("imagePreviews");
    previewContainer.innerHTML = "";

    if (this.files.length > 3) {
      showAlert("Você só pode selecionar no máximo 3 imagens", "warning");
      this.value = "";
      return;
    }

    Array.from(this.files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = function (event) {
        const preview = document.createElement("img");
        preview.src = event.target.result;
        preview.className = "image-preview";
        previewContainer.appendChild(preview);
      };
      reader.readAsDataURL(file);
    });
  });

document
  .getElementById("addProductForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const brand = document.getElementById("productBrand").value.trim();
    const fabric = document.getElementById("productFabric").value;
    const colors = [...colorsContainer.querySelectorAll(".tag")].map(
      (el) => el.textContent
    );
    const sizes = [...sizesContainer.querySelectorAll(".tag")].map(
      (el) => el.textContent
    );
    const images = document.getElementById("productImages").files;
    const outOfStock = document.getElementById("outOfStock").checked;

    if (
      !brand ||
      !fabric ||
      colors.length === 0 ||
      sizes.length === 0 ||
      images.length === 0
    ) {
      showAlert(
        "Preencha todos os campos e adicione cores, tamanhos e pelo menos uma imagem.",
        "warning"
      );
      return;
    }

    const formData = new FormData();
    formData.append("brand", brand);
    formData.append("fabric", fabric);
    colors.forEach((color) => formData.append("colors", color));
    sizes.forEach((size) => formData.append("sizes", size));

    const maxImages = Math.min(images.length, 3);
    for (let i = 0; i < maxImages; i++) {
      formData.append("images", images[i]);
    }

    formData.append("outOfStock", outOfStock);

    try {
      const res = await fetch("http://localhost:8080/api/products", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        showAlert("Camisa cadastrada!", "success");
        loadProducts();
        document.getElementById("addProductForm").reset();
        colorsContainer.innerHTML = "";
        sizesContainer.innerHTML = "";
        document.getElementById("imagePreviews").innerHTML = "";
      } else {
        showAlert("Erro ao cadastrar.", "error");
      }
    } catch (e) {
      showAlert("Erro ao conectar com servidor.", "error");
    }
  });

async function loadProducts() {
  const filter = searchInput.value.trim();
  let url = "http://localhost:8080/api/products";
  if (filter) {
    url += "?brand=" + encodeURIComponent(filter);
  }

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Erro ao carregar produtos");
    const products = await res.json();
    productsGrid.innerHTML = "";

    products.forEach((p, index) => {
      const card = document.createElement("div");
      card.classList.add("product-card");
      card.style.setProperty("--order", index);

      if (p.imagePaths && p.imagePaths.length > 0) {
        const carousel = document.createElement("div");
        carousel.classList.add("carousel");
        carousel.id = `carousel-${p.id}`;
        carousel.dataset.count = p.imagePaths.length;

        const carouselImages = document.createElement("div");
        carouselImages.classList.add("carousel-images");

        p.imagePaths.forEach((path, index) => {
          if (!path) return;

          const img = document.createElement("img");
          img.src = `http://localhost:8080/${path}`;
          img.alt = `${p.brand} - Imagem ${index + 1}`;
          img.classList.add("carousel-image");
          img.classList.toggle("active", index === 0);
          carouselImages.appendChild(img);
        });

        if (p.imagePaths.length > 1) {
          const prevButton = document.createElement("button");
          prevButton.classList.add("carousel-button", "prev");
          prevButton.innerHTML = "&lt;";
          prevButton.onclick = (e) => {
            e.stopPropagation();
            navigateCarousel(`carousel-${p.id}`, -1);
          };

          const nextButton = document.createElement("button");
          nextButton.classList.add("carousel-button", "next");
          nextButton.innerHTML = "&gt;";
          nextButton.onclick = (e) => {
            e.stopPropagation();
            navigateCarousel(`carousel-${p.id}`, 1);
          };

          carousel.appendChild(prevButton);
          carousel.appendChild(nextButton);
        }

        carousel.appendChild(carouselImages);

        const imageContainer = document.createElement("div");
        imageContainer.classList.add("product-image-container");
        imageContainer.appendChild(carousel);
        card.appendChild(imageContainer);
      }

      const cardContent = document.createElement("div");
      cardContent.classList.add("product-card-content");

      const brand = document.createElement("div");
      brand.textContent = p.brand;
      brand.style.fontWeight = "600";
      brand.style.fontSize = "1.1rem";
      brand.style.color = "var(--secondary)";
      brand.style.marginBottom = "8px";

      const fabric = document.createElement("div");
      fabric.textContent = `Malha: ${p.fabric}`;
      fabric.style.marginBottom = "8px";
      fabric.style.color = "#e0e0e0";

      const createTagDisplay = (items, label) => {
        const container = document.createElement("div");
        const labelSpan = document.createElement("span");
        labelSpan.textContent = `${label}: `;
        labelSpan.style.fontWeight = "500";
        labelSpan.style.color = "var(--secondary)";

        const tagsContainer = document.createElement("div");
        tagsContainer.className = "tags-display";
        tagsContainer.style.flexWrap = "wrap";

        if (items && items.length) {
          items.forEach((item) => {
            const tag = document.createElement("span");
            tag.className = "tag-item";
            tag.textContent = item;
            tagsContainer.appendChild(tag);
          });
        } else {
          const emptyTag = document.createElement("span");
          emptyTag.className = "tag-item";
          emptyTag.textContent = "Nenhum";
          emptyTag.style.opacity = "0.7";
          tagsContainer.appendChild(emptyTag);
        }

        container.appendChild(labelSpan);
        container.appendChild(tagsContainer);
        return container;
      };

      const colors = createTagDisplay(p.colors, "Cores");
      const sizes = createTagDisplay(p.sizes, "Tamanhos");
      const stock = document.createElement("div");
      stock.textContent = p.outOfStock ? "⛔ Sem estoque" : "✅ Em estoque";
      stock.style.color = p.outOfStock ? "var(--danger)" : "var(--success)";
      stock.style.fontWeight = "600";
      stock.style.marginTop = "auto";
      stock.style.paddingTop = "10px";
      stock.style.borderTop = "1px dashed rgba(158, 231, 255, 0.2)";

      const buttonsContainer = document.createElement("div");
      buttonsContainer.style.display = "flex";
      buttonsContainer.style.justifyContent = "space-between";
      buttonsContainer.style.marginTop = "15px";
      buttonsContainer.style.gap = "10px";

      const deleteBtn = document.createElement("button");
      deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
      deleteBtn.classList.add("danger-btn");
      deleteBtn.setAttribute("aria-label", "Excluir");
      deleteBtn.onclick = (e) => {
        e.stopPropagation();
        deleteProduct(p.id);
      };

      const editBtn = document.createElement("button");
      editBtn.innerHTML = '<i class="fas fa-edit"></i>';
      editBtn.classList.add("edit-btn");
      editBtn.setAttribute("aria-label", "Editar");
      editBtn.onclick = (e) => {
        e.stopPropagation();
        openEditModal(p);
      };

      buttonsContainer.appendChild(editBtn);
      buttonsContainer.appendChild(deleteBtn);

      cardContent.append(brand, fabric, colors, sizes, stock, buttonsContainer);
      card.appendChild(cardContent);
      productsGrid.appendChild(card);
    });
  } catch (error) {
    showAlert("Erro ao carregar produtos", "error");
  }
}

async function deleteProduct(id) {
  const confirmed = await new Promise((resolve) => {
    showAlert("Tem certeza que deseja excluir esta camisa?", "warning", 0);
    const customAlert = document.getElementById("customAlert");

    const confirmBtn = document.createElement("button");
    confirmBtn.textContent = "Sim";
    confirmBtn.style.margin = "10px auto 0"; // Centraliza o botão
    confirmBtn.style.padding = "5px 20px";
    confirmBtn.style.background = "var(--danger)";
    confirmBtn.style.color = "white";
    confirmBtn.style.border = "none";
    confirmBtn.style.borderRadius = "4px";
    confirmBtn.style.display = "block"; // Garante que o margin auto funcione
    confirmBtn.onclick = () => {
      customAlert.querySelector(".alert-message > div")?.remove();
      resolve(true);
    };

    const btnContainer = document.createElement("div");
    btnContainer.style.marginTop = "10px";
    btnContainer.style.width = "100%"; // Ocupa toda a largura
    btnContainer.appendChild(confirmBtn);

    customAlert.querySelector(".alert-message").appendChild(btnContainer);
  });

  if (!confirmed) return;

  try {
    const res = await fetch(`http://localhost:8080/api/products/${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      showAlert("Camisa excluída com sucesso.", "success");
      loadProducts();
    } else {
      showAlert("Erro ao excluir a camisa.", "error");
    }
  } catch (e) {
    showAlert("Erro ao conectar com servidor.", "error");
  }
}

function openEditModal(product) {
  document.getElementById("editProductId").value = product.id;
  document.getElementById("editProductBrand").value = product.brand;
  document.getElementById("editProductFabric").value = product.fabric;
  document.getElementById("editOutOfStock").checked =
    product.outOfStock || false;

  currentProductImages = [];
  removedImages = [];

  clearEditTags();
  if (product.colors && product.colors.length) {
    product.colors.forEach((color) => createTag(color, editColorsContainer));
  }
  if (product.sizes && product.sizes.length) {
    product.sizes.forEach((size) => createTag(size, editSizesContainer));
  }

  const previewContainer = document.getElementById("editImagePreviews");
  previewContainer.innerHTML = "";

  if (product.imagePaths && product.imagePaths.length > 0) {
    previewContainer.style.display = "flex";
    previewContainer.style.flexWrap = "wrap";
    previewContainer.style.gap = "15px";
    previewContainer.style.justifyContent = "center";

    product.imagePaths.forEach((path, index) => {
      if (!path) return;

      const imageId = `existing-img-${index}`;
      currentProductImages.push({ id: imageId, path: path });

      const imgContainer = document.createElement("div");
      imgContainer.className = "image-preview-container";
      imgContainer.id = imageId;
      imgContainer.style.position = "relative";
      imgContainer.style.width = "200px";
      imgContainer.style.height = "200px";

      const img = document.createElement("img");
      img.src = `http://localhost:8080/${path}`;
      img.className = "image-preview";
      img.style.width = "100%";
      img.style.height = "100%";
      img.style.objectFit = "contain";

      const removeBtn = document.createElement("button");
      removeBtn.className = "remove-image-btn";
      removeBtn.innerHTML = "&times;";
      removeBtn.title = "Remover imagem";
      removeBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        removedImages.push(path);
        imgContainer.remove();
      };

      imgContainer.appendChild(img);
      imgContainer.appendChild(removeBtn);
      previewContainer.appendChild(imgContainer);
    });
  }

  editModal.style.display = "flex";
}

searchInput.addEventListener("input", () => {
  clearTimeout(searchInput._timeout);
  searchInput._timeout = setTimeout(loadProducts, 300);
});

document.getElementById("editAddColorBtn").addEventListener("click", () => {
  const val = document.getElementById("editColorInput").value.trim();
  if (val) {
    createTag(val, editColorsContainer);
    document.getElementById("editColorInput").value = "";
  }
});

document.getElementById("editAddSizeBtn").addEventListener("click", () => {
  const val = document.getElementById("editSizeInput").value.trim();
  if (val) {
    createTag(val, editSizesContainer);
    document.getElementById("editSizeInput").value = "";
  }
});

closeEditModalBtn.onclick = () => {
  editModal.style.display = "none";
};

document
  .getElementById("editProductImages")
  .addEventListener("change", function (e) {
    const previewContainer = document.getElementById("editImagePreviews");

    const existingImages = currentProductImages.filter(
      (img) => !removedImages.includes(img.path)
    ).length;

    const availableSlots = Math.max(0, 3 - existingImages);

    if (this.files.length > availableSlots) {
      showAlert(
        `Você só pode adicionar mais ${availableSlots} imagens (limite de 3 no total)`,
        "warning"
      );
      this.value = "";
      return;
    }

    Array.from(this.files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = function (event) {
        const imgContainer = document.createElement("div");
        imgContainer.className = "image-preview-container";

        const preview = document.createElement("img");
        preview.src = event.target.result;
        preview.className = "image-preview";
        preview.style.width = "100%";
        preview.style.height = "100%";
        preview.style.objectFit = "contain";

        const removeBtn = document.createElement("button");
        removeBtn.className = "remove-image-btn";
        removeBtn.innerHTML = "&times;";
        removeBtn.title = "Remover imagem";
        removeBtn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          imgContainer.remove();
        };

        imgContainer.appendChild(preview);
        imgContainer.appendChild(removeBtn);
        previewContainer.appendChild(imgContainer);
      };
      reader.readAsDataURL(file);
    });
  });

document
  .getElementById("editProductForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = document.getElementById("editProductId").value;
    const brand = document.getElementById("editProductBrand").value.trim();
    const fabric = document.getElementById("editProductFabric").value;
    const colors = [...editColorsContainer.querySelectorAll(".tag")].map(
      (el) => el.textContent
    );
    const sizes = [...editSizesContainer.querySelectorAll(".tag")].map(
      (el) => el.textContent
    );
    const newImages = document.getElementById("editProductImages").files;
    const outOfStock = document.getElementById("editOutOfStock").checked;

    if (!brand || !fabric || colors.length === 0 || sizes.length === 0) {
      showAlert(
        "Preencha todos os campos e adicione cores e tamanhos.",
        "warning"
      );
      return;
    }

    const formData = new FormData();
    formData.append("brand", brand);
    formData.append("fabric", fabric);
    colors.forEach((color) => formData.append("colors", color));
    sizes.forEach((size) => formData.append("sizes", size));

    removedImages.forEach((imgPath) => {
      formData.append("removedImages", imgPath);
    });

    if (newImages && newImages.length > 0) {
      Array.from(newImages).forEach((file) => {
        formData.append("images", file);
      });
    }

    formData.append("outOfStock", outOfStock);

    try {
      const res = await fetch(`http://localhost:8080/api/products/${id}`, {
        method: "PUT",
        body: formData,
      });
      if (res.ok) {
        showAlert("Camisa atualizada!", "success");
        editModal.style.display = "none";
        loadProducts();
      } else {
        showAlert("Erro ao atualizar.", "error");
      }
    } catch (e) {
      showAlert("Erro ao conectar com servidor.", "error");
    }
  });

function setupMobileButtons() {
  const buttons = document.querySelectorAll(".edit-btn, .danger-btn");

  buttons.forEach((btn) => {
    btn.addEventListener("mouseenter", function () {
      this.setAttribute("data-show-tooltip", "true");
    });

    btn.addEventListener("mouseleave", function () {
      this.removeAttribute("data-show-tooltip");
    });

    btn.addEventListener(
      "touchstart",
      function (e) {
        e.preventDefault();
        this.setAttribute("data-show-tooltip", "true");
        setTimeout(() => {
          this.removeAttribute("data-show-tooltip");
        }, 2000);
      },
      { passive: false }
    );
  });
}

function adjustCardHeights() {
  if (window.innerWidth <= 768) {
    const rows = [];
    const cards = document.querySelectorAll(".product-card");
    let currentRow = [];
    let currentTop = null;

    cards.forEach((card, index) => {
      const rect = card.getBoundingClientRect();

      if (currentTop === null) {
        currentTop = rect.top;
      }

      if (rect.top === currentTop) {
        currentRow.push(card);
      } else {
        rows.push(currentRow);
        currentRow = [card];
        currentTop = rect.top;
      }

      if (index === cards.length - 1) {
        rows.push(currentRow);
      }
    });

    rows.forEach((row) => {
      let maxHeight = 0;

      row.forEach((card) => {
        card.style.height = "auto";
        maxHeight = Math.max(maxHeight, card.offsetHeight);
      });

      row.forEach((card) => {
        card.style.height = `${maxHeight}px`;
      });
    });
  } else {
    document.querySelectorAll(".product-card").forEach((card) => {
      card.style.height = "auto";
    });
  }
}

document.addEventListener("DOMContentLoaded", function () {
  setupMobileButtons();

  document.querySelectorAll(".edit-btn").forEach((btn) => {
    btn.setAttribute("aria-label", "Editar");
  });

  document.querySelectorAll(".danger-btn").forEach((btn) => {
    btn.setAttribute("aria-label", "Excluir");
  });

  loadProducts();
});

window.addEventListener("load", adjustCardHeights);
window.addEventListener("resize", adjustCardHeights);
window.addEventListener("resize", function () {
  setupMobileButtons();
});