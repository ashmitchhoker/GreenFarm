const Shop = (() => {
  const ITEMS = [
    {
      id: "tree",
      name: "Tree",
      icon: "assets/tree/Tree 1.png",
      type: "tree",
      w: 140,
      h: 180,
    },
    {
      id: "mud_house",
      name: "Mud House",
      icon: "assets/wood_house/house1.png",
      type: "mud_house",
      w: 160,
      h: 160,
    },
    {
      id: "solar_panel",
      name: "Solar Panel",
      icon: "assets/solar_panel/solar_panel.png",
      type: "solar_panel",
      w: 120,
      h: 120,
    },
  ];

  let activeItem = null;
  let shopIcon, shopModal, shopItemsContainer, closeBtn;

  function init() {
    shopIcon = document.getElementById("shop-icon");
    shopModal = document.getElementById("shop-modal");
    shopItemsContainer = document.getElementById("shop-items");
    closeBtn = document.getElementById("close-shop");

    shopIcon.addEventListener("click", openShop);
    closeBtn.addEventListener("click", closeShop);

    ITEMS.forEach((item) => {
      const div = document.createElement("div");
      div.style.border = "2px solid #ddd";
      div.style.borderRadius = "8px";
      div.style.padding = "10px";
      div.style.textAlign = "center";
      div.style.cursor = "pointer";
      div.style.background = "#f9fafb";

      const img = document.createElement("img");
      img.src = item.icon;
      img.style.width = "60px";
      img.style.height = "60px";
      img.style.objectFit = "contain";

      const span = document.createElement("div");
      span.textContent = item.name;
      span.style.marginTop = "8px";
      span.style.fontWeight = "bold";
      span.style.color = "#374151";

      div.appendChild(img);
      div.appendChild(span);

      div.addEventListener("click", () => {
        activeItem = item;
        closeShop();
        // Delay to prevent immediate click registration in game
        setTimeout(() => {
          Input.consumeClick();
        }, 100);
      });

      shopItemsContainer.appendChild(div);
    });

    // Make touch events not propagate to game when interacting with UI
    shopIcon.addEventListener("touchstart", (e) => e.stopPropagation());
    shopModal.addEventListener("touchstart", (e) => e.stopPropagation());
    shopModal.addEventListener("mousedown", (e) => e.stopPropagation());
  }

  function openShop() {
    shopModal.style.display = "block";
    document.getElementById("shop-badge").style.display = "none";
  }

  function closeShop() {
    shopModal.style.display = "none";
  }

  function getActiveItem() {
    return activeItem;
  }

  function clearActiveItem() {
    activeItem = null;
  }

  return { init, getActiveItem, clearActiveItem };
})();
