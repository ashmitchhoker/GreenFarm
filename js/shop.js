const Shop = (() => {
  const ITEMS = [
    {
      id: "category_trees",
      name: "Trees",
      icon: "assets/tree/Tree 1.png",
      isCategory: true,
      options: [
        {
          id: "tree",
          name: "Tree",
          icon: "assets/tree/Tree 1.png",
          type: "tree",
          treeType: 0,
          w: 140,
          h: 180,
          cost: 1,
        },
        {
          id: "tree2",
          name: "Orange Tree",
          icon: "assets/tree/Tree 2.png",
          type: "tree",
          treeType: 1,
          w: 140,
          h: 180,
          cost: 1,
        },
        {
          id: "tree3",
          name: "Pine Tree",
          icon: "assets/tree/Tree 3.png",
          type: "tree",
          treeType: 2,
          w: 120,
          h: 180,
          cost: 1,
        }
      ]
    },
    {
      id: "category_houses",
      name: "Houses",
      icon: "assets/wood_house/house1.png",
      isCategory: true,
      options: [
        {
          id: "house1",
          name: "Brick House",
          icon: "assets/wood_house/house1.png",
          type: "mud_house",
          w: 200,
          h: 200,
          cost: 5,
        },
        {
          id: "house2",
          name: "Wood House Flat",
          icon: "assets/wood_house/house2.png",
          type: "mud_house",
          w: 200,
          h: 200,
          cost: 5,
        },
        {
          id: "house3",
          name: "Mud House",
          icon: "assets/wood_house/house3.png",
          type: "mud_house",
          w: 200,
          h: 200,
          cost: 5,
        },
        {
          id: "house4",
          name: "Wood House Tall",
          icon: "assets/wood_house/house4.png",
          type: "mud_house",
          w: 200,
          h: 200,
          cost: 5,
        }
      ]
    },
    {
      id: "solar_panel",
      name: "Solar Panel",
      icon: "assets/solar_panel/solar_panel.png",
      type: "solar_panel",
      w: 120,
      h: 120,
      cost: 3,
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

    // Make touch events not propagate to game when interacting with UI
    shopIcon.addEventListener("touchstart", (e) => e.stopPropagation());
    shopModal.addEventListener("touchstart", (e) => e.stopPropagation());
    shopModal.addEventListener("mousedown", (e) => e.stopPropagation());
    
    renderItems(ITEMS);
  }

  function renderItems(itemsArray) {
    shopItemsContainer.innerHTML = "";

    if (itemsArray !== ITEMS) {
      // Add a back button
      const backDiv = document.createElement("div");
      backDiv.style.border = "2px solid #ddd";
      backDiv.style.borderRadius = "8px";
      backDiv.style.padding = "10px";
      backDiv.style.textAlign = "center";
      backDiv.style.cursor = "pointer";
      backDiv.style.background = "#e5e7eb";
      backDiv.style.gridColumn = "1 / -1";
      backDiv.style.fontWeight = "bold";
      backDiv.textContent = "⬅ Back to Categories";
      backDiv.addEventListener("click", () => renderItems(ITEMS));
      shopItemsContainer.appendChild(backDiv);
    }

    itemsArray.forEach((item) => {
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

      if (!item.isCategory && item.cost !== undefined) {
        const costSpan = document.createElement("div");
        costSpan.innerHTML = `<img src="assets/coins/coin_2.png" style="width: 80px; vertical-align: middle; margin-right: 0.5px;" />${item.cost}`;
        costSpan.style.marginTop = "4px";
        costSpan.style.color = "#facc15";
        costSpan.style.fontWeight = "bold";
        costSpan.style.fontSize = "18px";
        costSpan.style.textShadow = "1px 1px 2px rgba(0,0,0,0.5)";
        div.appendChild(costSpan);
      } else if (item.isCategory) {
        const catSpan = document.createElement("div");
        catSpan.textContent = "📁 Category";
        catSpan.style.marginTop = "4px";
        catSpan.style.fontSize = "12px";
        catSpan.style.color = "#6b7280";
        div.appendChild(catSpan);
      }

      div.addEventListener("click", () => {
        if (item.isCategory) {
          renderItems(item.options);
        } else {
          activeItem = item;
          closeShop();
          // Delay to prevent immediate click registration in game
          setTimeout(() => {
            Input.consumeClick();
          }, 100);
        }
      });

      shopItemsContainer.appendChild(div);
    });
  }

  function openShop() {
    renderItems(ITEMS); // Always open at root
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
