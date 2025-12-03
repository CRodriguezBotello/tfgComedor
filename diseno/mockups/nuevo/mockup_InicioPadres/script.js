document.addEventListener("DOMContentLoaded", () => {

    const semanaBtns = document.querySelectorAll(".marcar-semana");
    const selectMonthBtn = document.getElementById("select-month");
    const rows = document.querySelectorAll(".calendar tbody tr");

    let mesSeleccionado = false;

    function esCeldaValida(cell) {
        return (
            cell.innerText.trim() !== "" &&
            !cell.classList.contains("dia-especial") &&
            !cell.classList.contains("dia-inactivo") &&
            !cell.classList.contains("disabled")
        );
    }

    // -------- CLICK INDIVIDUAL ----------
    document.querySelectorAll(".calendar td:not(:last-child)").forEach(cell => {
        cell.addEventListener("click", () => {
            if (esCeldaValida(cell)) {
                cell.classList.toggle("selected");
            }
        });
    });

    // -------- BOTONES SEMANA ----------
    semanaBtns.forEach((btn, index) => {

        btn.textContent = "Marcar semana";

        btn.addEventListener("click", () => {
            const row = rows[index];
            const cells = [...row.querySelectorAll("td:not(:last-child)")]
                .filter(c => esCeldaValida(c));

            const allSelected = cells.every(c => c.classList.contains("selected"));

            if (allSelected) {
                cells.forEach(c => c.classList.remove("selected"));
                btn.textContent = "Marcar semana";
            } else {
                cells.forEach(c => c.classList.add("selected"));
                btn.textContent = "Desmarcar semana";
            }
        });
    });

    // -------- BOTÓN MARCAR MES ----------
    selectMonthBtn.addEventListener("click", () => {

        const allValidCells = [...document.querySelectorAll(".calendar td:not(:last-child)")]
            .filter(cell => esCeldaValida(cell));

        if (!mesSeleccionado) {
            allValidCells.forEach(cell => cell.classList.add("selected"));
            selectMonthBtn.textContent = "Desmarcar mes";
            mesSeleccionado = true;
        } else {
            allValidCells.forEach(cell => cell.classList.remove("selected"));
            selectMonthBtn.textContent = "Marcar mes";
            mesSeleccionado = false;
        }
    });
});
