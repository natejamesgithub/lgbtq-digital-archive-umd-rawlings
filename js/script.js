document.addEventListener("DOMContentLoaded", () => {
  const archiveData = [
    {
      title: "Dupont Circle Oral History",
      description: "Interview with longtime LGBTQ+ activist in D.C.",
      type: "Audio",
    },
    {
      title: "Capital Pride 1995",
      description: "Archival images from early Pride events.",
      type: "Images",
    },
    {
      title: "AIDS Coalition Records",
      description: "Community documents from the 1980s.",
      type: "Text",
    },
  ];

  const archiveGrid = document.getElementById("archiveGrid");

  archiveData.forEach(item => {
    const card = document.createElement("div");
    card.classList.add("archive-card");

    card.innerHTML = `
      <h3>${item.title}</h3>
      <p>${item.description}</p>
      <small>${item.type}</small>
    `;

    archiveGrid.appendChild(card);
  });

  // Explore button scroll behavior
  const exploreBtn = document.getElementById("exploreBtn");
  exploreBtn.addEventListener("click", () => {
    archiveGrid.scrollIntoView({ behavior: "smooth" });
  });
});