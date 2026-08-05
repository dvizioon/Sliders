function shuffleNodes(container) {
  const nodes = [...container.children];
  for (let i = nodes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [nodes[i], nodes[j]] = [nodes[j], nodes[i]];
  }
  nodes.forEach((node) => container.appendChild(node));
}

function clearFeedback(root) {
  const feedback = root.querySelector(".dnd-feedback");
  if (!feedback) return;
  feedback.textContent = "";
  feedback.className = "dnd-feedback";
}

function getChip(root, id) {
  return root.querySelector(`.dnd-chip[data-item-id="${CSS.escape(id)}"]`);
}

function bindDropZone(root, zone) {
  zone.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.stopPropagation();
    zone.classList.add("dnd-drop--over");
    e.dataTransfer.dropEffect = "move";
  });

  zone.addEventListener("dragleave", (e) => {
    if (!zone.contains(e.relatedTarget)) {
      zone.classList.remove("dnd-drop--over");
    }
  });

  zone.addEventListener("drop", (e) => {
    e.preventDefault();
    e.stopPropagation();
    zone.classList.remove("dnd-drop--over");

    const id = e.dataTransfer.getData("text/plain");
    const chip = getChip(root, id);
    if (!chip) return;

    zone.appendChild(chip);
    clearFeedback(root);
    root.querySelectorAll(".dnd-chip").forEach((item) => {
      item.classList.remove("dnd-chip--correct", "dnd-chip--wrong");
    });
  });
}

function checkActivity(root) {
  const drops = root.querySelectorAll(".dnd-zone .dnd-drop");
  const chips = [...root.querySelectorAll(".dnd-chip")];
  const feedback = root.querySelector(".dnd-feedback");
  let correct = 0;
  let placed = 0;

  chips.forEach((chip) => {
    chip.classList.remove("dnd-chip--correct", "dnd-chip--wrong");
  });

  drops.forEach((drop) => {
    const category = drop.closest(".dnd-zone")?.dataset.category;
    drop.querySelectorAll(".dnd-chip").forEach((chip) => {
      placed++;
      if (chip.dataset.category === category) {
        chip.classList.add("dnd-chip--correct");
        correct++;
      } else {
        chip.classList.add("dnd-chip--wrong");
      }
    });
  });

  if (!feedback) return;

  if (placed < chips.length) {
    feedback.textContent = `Coloque todos os itens nas caixas (${placed}/${chips.length}).`;
    feedback.className = "dnd-feedback dnd-feedback--warn";
    return;
  }

  if (correct === chips.length) {
    feedback.textContent = "Perfeito! Todos os itens estão na caixa certa.";
    feedback.className = "dnd-feedback dnd-feedback--ok";
    return;
  }

  feedback.textContent = `${correct} de ${chips.length} corretos. Ajuste os itens em vermelho.`;
  feedback.className = "dnd-feedback dnd-feedback--partial";
}

function resetActivity(root) {
  const bank = root.querySelector(".dnd-bank-drop");
  if (!bank) return;

  root.querySelectorAll(".dnd-chip").forEach((chip) => {
    chip.classList.remove("dnd-chip--correct", "dnd-chip--wrong", "dnd-chip--dragging");
    bank.appendChild(chip);
  });

  shuffleNodes(bank);
  clearFeedback(root);
}

function bindActivity(root) {
  if (root.dataset.bound === "1") return;
  root.dataset.bound = "1";

  const bank = root.querySelector(".dnd-bank-drop");
  if (bank) shuffleNodes(bank);

  root.querySelectorAll(".dnd-chip").forEach((chip) => {
    chip.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", chip.dataset.itemId);
      e.dataTransfer.effectAllowed = "move";
      chip.classList.add("dnd-chip--dragging");
      e.stopPropagation();
    });

    chip.addEventListener("dragend", () => {
      chip.classList.remove("dnd-chip--dragging");
      root.querySelectorAll(".dnd-drop").forEach((zone) => zone.classList.remove("dnd-drop--over"));
    });
  });

  root.querySelectorAll(".dnd-drop").forEach((zone) => bindDropZone(root, zone));

  root.querySelector(".dnd-check-btn")?.addEventListener("click", (e) => {
    e.stopPropagation();
    checkActivity(root);
  });

  root.querySelector(".dnd-reset-btn")?.addEventListener("click", (e) => {
    e.stopPropagation();
    resetActivity(root);
  });

  ["mousedown", "touchstart"].forEach((eventName) => {
    root.addEventListener(
      eventName,
      (e) => {
        if (e.target.closest(".dnd-chip, .dnd-drop, .dnd-check-btn, .dnd-reset-btn")) {
          e.stopPropagation();
        }
      },
      { passive: true }
    );
  });
}

export function initDndActivities() {
  document.querySelectorAll(".dnd-activity").forEach(bindActivity);
}
