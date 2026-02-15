// Constants
const SLICES_PER_PIZZA = 12;
const COST_PER_PIZZA = 10.53;

// Store orders in an array
let orders = [];

// DOM elements
document.addEventListener('DOMContentLoaded', function() {
    // Get form and attach submit event
    const orderForm = document.getElementById('orderForm');
    orderForm.addEventListener('submit', addOrder);

    // Load orders from localStorage if available
    loadOrders();
});

// Add a new order
function addOrder(e) {
    e.preventDefault();

    const name = document.getElementById('name').value;
    const cheeseSlices = parseInt(document.getElementById('cheese_slices').value) || 0;
    const pepperoniSlices = parseInt(document.getElementById('pepperoni_slices').value) || 0;
    const paid = document.getElementById('paid').checked;

    if (!name || (cheeseSlices === 0 && pepperoniSlices === 0)) {
        alert('Please enter your name and at least one slice!');
        return;
    }

    // Create a new order object
    const order = {
        id: Date.now(), // Use timestamp as a unique ID
        name: name,
        cheese_slices: cheeseSlices,
        pepperoni_slices: pepperoniSlices,
        paid: paid
    };

    // Add order to array
    orders.push(order);

    // Save to localStorage
    saveOrders();

    // Update UI
    updateOrdersTable();
    updatePizzaCalculations();
    updatePizzaVisualization();

    // Reset form
    orderForm.reset();
}

// Delete an order
function deleteOrder(id) {
    orders = orders.filter(order => order.id !== id);
    saveOrders();
    updateOrdersTable();
    updatePizzaCalculations();
    updatePizzaVisualization();
}

// Update orders table
function updateOrdersTable() {
    const tableBody = document.getElementById('ordersTableBody');
    tableBody.innerHTML = '';

    const costPerSlice = calculateCostPerSlice();

    orders.forEach(order => {
        const row = document.createElement('tr');

        const totalSlices = order.cheese_slices + order.pepperoni_slices;
        const orderCost = (totalSlices * costPerSlice).toFixed(2);

        row.innerHTML = `
            <td>${order.name}</td>
            <td>${order.cheese_slices}</td>
            <td>${order.pepperoni_slices}</td>
            <td>${totalSlices}</td>
            <td>$${orderCost}</td>
            <td class="paid-status ${order.paid ? 'paid' : 'not-paid'}">${order.paid ? 'Yes' : 'No'}</td>
            <td><button class="delete-btn" onclick="deleteOrder(${order.id})">Delete</button></td>
        `;

        tableBody.appendChild(row);
    });
}

// Update pizza calculations
function updatePizzaCalculations() {
    // Calculate totals
    const totalCheeseSlices = orders.reduce((sum, order) => sum + order.cheese_slices, 0);
    const totalPepperoniSlices = orders.reduce((sum, order) => sum + order.pepperoni_slices, 0);

    // Calculate full pizzas needed (using floor to get base amount)
    let cheesePizzasNeeded = Math.floor(totalCheeseSlices / SLICES_PER_PIZZA);
    let pepperoniPizzasNeeded = Math.floor(totalPepperoniSlices / SLICES_PER_PIZZA);

    // Calculate remaining slices needed after full pizzas
    let remainingCheeseSlices = totalCheeseSlices - (cheesePizzasNeeded * SLICES_PER_PIZZA);
    let remainingPepperoniSlices = totalPepperoniSlices - (pepperoniPizzasNeeded * SLICES_PER_PIZZA);

    // Prioritize full pizzas: if remaining > 6, use a full pizza instead of half & half
    if (remainingCheeseSlices > 6) {
        cheesePizzasNeeded += 1;
        remainingCheeseSlices = 0;
    }
    if (remainingPepperoniSlices > 6) {
        pepperoniPizzasNeeded += 1;
        remainingPepperoniSlices = 0;
    }

    // Half pizza optimization - only use when both types have small remaining amounts (1-6)
    let halfPizzas = 0;

    if (remainingCheeseSlices > 0 && remainingPepperoniSlices > 0) {
        // Both have small remainders, use 1 half & half pizza
        halfPizzas = 1;
    } else {
        // Only one type has remaining, use a full pizza for it
        if (remainingCheeseSlices > 0) {
            cheesePizzasNeeded += 1;
        }
        if (remainingPepperoniSlices > 0) {
            pepperoniPizzasNeeded += 1;
        }
    }

    // Calculate leftover slices (for display)
    const totalCheeseCapacity = (cheesePizzasNeeded * SLICES_PER_PIZZA) + (halfPizzas * 6);
    const totalPepperoniCapacity = (pepperoniPizzasNeeded * SLICES_PER_PIZZA) + (halfPizzas * 6);
    const leftoverCheeseSlices = totalCheeseCapacity - totalCheeseSlices;
    const leftoverPepperoniSlices = totalPepperoniCapacity - totalPepperoniSlices;

    // Calculate total pizzas and cost (half & half pizzas are full pizzas, not half price)
    const totalPizzas = cheesePizzasNeeded + pepperoniPizzasNeeded + halfPizzas;
    const totalCost = totalPizzas * COST_PER_PIZZA;

    // Calculate cost per slice
    const totalSlices = totalCheeseSlices + totalPepperoniSlices;
    const costPerSlice = totalSlices > 0 ? totalCost / totalSlices : 0;

    // Update DOM elements
    document.getElementById('total_cheese_slices').textContent = totalCheeseSlices;
    document.getElementById('cheese_pizzas_needed').textContent = cheesePizzasNeeded;
    document.getElementById('leftover_cheese_slices').textContent = leftoverCheeseSlices;

    document.getElementById('total_pepperoni_slices').textContent = totalPepperoniSlices;
    document.getElementById('pepperoni_pizzas_needed').textContent = pepperoniPizzasNeeded;
    document.getElementById('leftover_pepperoni_slices').textContent = leftoverPepperoniSlices;

    document.getElementById('half_pizzas').textContent = halfPizzas;
    document.getElementById('total_pizzas').textContent = totalPizzas.toFixed(1);
    document.getElementById('total_cost').textContent = totalCost.toFixed(2);

    document.getElementById('cost_per_slice').textContent = costPerSlice.toFixed(2);
}

// Calculate cost per slice
function calculateCostPerSlice() {
    const totalCheeseSlices = orders.reduce((sum, order) => sum + order.cheese_slices, 0);
    const totalPepperoniSlices = orders.reduce((sum, order) => sum + order.pepperoni_slices, 0);

    // Calculate full pizzas needed (using floor to get base amount)
    let cheesePizzasNeeded = Math.floor(totalCheeseSlices / SLICES_PER_PIZZA);
    let pepperoniPizzasNeeded = Math.floor(totalPepperoniSlices / SLICES_PER_PIZZA);

    // Calculate remaining slices needed after full pizzas
    let remainingCheeseSlices = totalCheeseSlices - (cheesePizzasNeeded * SLICES_PER_PIZZA);
    let remainingPepperoniSlices = totalPepperoniSlices - (pepperoniPizzasNeeded * SLICES_PER_PIZZA);

    // Prioritize full pizzas: if remaining > 6, use a full pizza instead of half & half
    if (remainingCheeseSlices > 6) {
        cheesePizzasNeeded += 1;
        remainingCheeseSlices = 0;
    }
    if (remainingPepperoniSlices > 6) {
        pepperoniPizzasNeeded += 1;
        remainingPepperoniSlices = 0;
    }

    // Half pizza optimization - only use when both types have small remaining amounts (1-6)
    let halfPizzas = 0;

    if (remainingCheeseSlices > 0 && remainingPepperoniSlices > 0) {
        halfPizzas = 1;
    } else {
        if (remainingCheeseSlices > 0) {
            cheesePizzasNeeded += 1;
        }
        if (remainingPepperoniSlices > 0) {
            pepperoniPizzasNeeded += 1;
        }
    }

    const totalPizzas = cheesePizzasNeeded + pepperoniPizzasNeeded + halfPizzas;
    const totalCost = totalPizzas * COST_PER_PIZZA;

    const totalSlices = totalCheeseSlices + totalPepperoniSlices;
    return totalSlices > 0 ? totalCost / totalSlices : 0;
}

// Save orders to localStorage
function saveOrders() {
    localStorage.setItem('pizzaOrders', JSON.stringify(orders));
}

// Load orders from localStorage
function loadOrders() {
    const savedOrders = localStorage.getItem('pizzaOrders');
    if (savedOrders) {
        orders = JSON.parse(savedOrders);
        updateOrdersTable();
        updatePizzaCalculations();
    }
    updatePizzaVisualization();
}

// Create SVG pizza slice path
function createSlicePath(sliceIndex, totalSlices, radius, centerX, centerY) {
    const anglePerSlice = (2 * Math.PI) / totalSlices;
    const startAngle = sliceIndex * anglePerSlice - Math.PI / 2;
    const endAngle = (sliceIndex + 1) * anglePerSlice - Math.PI / 2;

    const x1 = centerX + radius * Math.cos(startAngle);
    const y1 = centerY + radius * Math.sin(startAngle);
    const x2 = centerX + radius * Math.cos(endAngle);
    const y2 = centerY + radius * Math.sin(endAngle);

    return `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`;
}

// Create a single pizza SVG
function createPizzaSVG(type, filledSlices) {
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", "0 0 100 100");
    svg.setAttribute("class", "pizza-svg");

    const centerX = 50;
    const centerY = 50;
    const radius = 45;
    const innerRadius = 8;

    // Create crust circle (background)
    const crust = document.createElementNS(svgNS, "circle");
    crust.setAttribute("cx", centerX);
    crust.setAttribute("cy", centerY);
    crust.setAttribute("r", radius);
    crust.setAttribute("class", "pizza-crust");
    svg.appendChild(crust);

    // Create 12 slices
    for (let i = 0; i < 12; i++) {
        const slice = document.createElementNS(svgNS, "path");
        slice.setAttribute("d", createSlicePath(i, 12, radius - 3, centerX, centerY));
        slice.setAttribute("class", "pizza-slice");

        if (type === 'cheese') {
            slice.classList.add(i < filledSlices ? 'slice-cheese' : 'slice-empty');
        } else if (type === 'pepperoni') {
            slice.classList.add(i < filledSlices ? 'slice-pepperoni' : 'slice-empty');
        } else if (type === 'half') {
            // First 6 slices are pepperoni, last 6 are cheese
            if (i < 6) {
                slice.classList.add(i < Math.min(filledSlices, 6) ? 'slice-pepperoni' : 'slice-empty');
            } else {
                slice.classList.add((i - 6) < Math.max(0, filledSlices - 6) ? 'slice-cheese' : 'slice-empty');
            }
        }

        svg.appendChild(slice);
    }

    // Add center circle
    const center = document.createElementNS(svgNS, "circle");
    center.setAttribute("cx", centerX);
    center.setAttribute("cy", centerY);
    center.setAttribute("r", innerRadius);
    center.setAttribute("class", "pizza-center");
    svg.appendChild(center);

    // Add cut lines
    for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 6 - Math.PI / 2;
        const line = document.createElementNS(svgNS, "line");
        line.setAttribute("x1", centerX + innerRadius * Math.cos(angle));
        line.setAttribute("y1", centerY + innerRadius * Math.sin(angle));
        line.setAttribute("x2", centerX + (radius - 3) * Math.cos(angle));
        line.setAttribute("y2", centerY + (radius - 3) * Math.sin(angle));
        line.setAttribute("stroke", "#8B4513");
        line.setAttribute("stroke-width", "1");
        svg.appendChild(line);
    }

    return svg;
}

// Update pizza visualization
function updatePizzaVisualization() {
    const container = document.getElementById('pizzaVisualization');
    container.innerHTML = '';

    // Calculate totals
    const totalCheeseSlices = orders.reduce((sum, order) => sum + order.cheese_slices, 0);
    const totalPepperoniSlices = orders.reduce((sum, order) => sum + order.pepperoni_slices, 0);

    if (totalCheeseSlices === 0 && totalPepperoniSlices === 0) {
        const message = document.createElement('p');
        message.className = 'no-pizzas-message';
        message.textContent = 'Add orders to see pizza visualization';
        container.appendChild(message);
        return;
    }

    // Calculate full pizzas needed (using floor to get base amount)
    let cheesePizzasNeeded = Math.floor(totalCheeseSlices / SLICES_PER_PIZZA);
    let pepperoniPizzasNeeded = Math.floor(totalPepperoniSlices / SLICES_PER_PIZZA);

    // Calculate remaining slices needed after full pizzas
    let remainingCheeseSlices = totalCheeseSlices - (cheesePizzasNeeded * SLICES_PER_PIZZA);
    let remainingPepperoniSlices = totalPepperoniSlices - (pepperoniPizzasNeeded * SLICES_PER_PIZZA);

    // Prioritize full pizzas: if remaining > 6, use a full pizza instead of half & half
    if (remainingCheeseSlices > 6) {
        cheesePizzasNeeded += 1;
        remainingCheeseSlices = 0;
    }
    if (remainingPepperoniSlices > 6) {
        pepperoniPizzasNeeded += 1;
        remainingPepperoniSlices = 0;
    }

    // Half pizza optimization - only use when both types have small remaining amounts (1-6)
    let halfPizzas = 0;
    let halfPizzaCheeseSlices = 0;
    let halfPizzaPepperoniSlices = 0;

    if (remainingCheeseSlices > 0 && remainingPepperoniSlices > 0) {
        // Both have small remainders, use 1 half & half pizza
        halfPizzas = 1;
        halfPizzaCheeseSlices = remainingCheeseSlices;
        halfPizzaPepperoniSlices = remainingPepperoniSlices;
    } else {
        // Only one type has remaining, use a full pizza for it
        if (remainingCheeseSlices > 0) {
            cheesePizzasNeeded += 1;
        }
        if (remainingPepperoniSlices > 0) {
            pepperoniPizzasNeeded += 1;
        }
    }

    // Calculate actual slices used for visualization
    // Cheese slices that go on full cheese pizzas (not on half & half)
    let cheeseSlicesForFullPizzas = totalCheeseSlices - halfPizzaCheeseSlices;
    // Pepperoni slices that go on full pepperoni pizzas (not on half & half)
    let pepperoniSlicesForFullPizzas = totalPepperoniSlices - halfPizzaPepperoniSlices;

    // Create cheese pizzas showing actual slices used
    for (let i = 0; i < cheesePizzasNeeded; i++) {
        const pizzaContainer = document.createElement('div');
        pizzaContainer.className = 'pizza-container';

        // Calculate how many slices this pizza has
        const slicesForThisPizza = Math.min(cheeseSlicesForFullPizzas, SLICES_PER_PIZZA);
        cheeseSlicesForFullPizzas -= slicesForThisPizza;

        const svg = createPizzaSVG('cheese', slicesForThisPizza);
        pizzaContainer.appendChild(svg);

        const label = document.createElement('span');
        label.className = 'pizza-label';
        label.textContent = `Cheese #${i + 1} (${slicesForThisPizza}/12)`;
        pizzaContainer.appendChild(label);

        container.appendChild(pizzaContainer);
    }

    // Create pepperoni pizzas showing actual slices used
    for (let i = 0; i < pepperoniPizzasNeeded; i++) {
        const pizzaContainer = document.createElement('div');
        pizzaContainer.className = 'pizza-container';

        // Calculate how many slices this pizza has
        const slicesForThisPizza = Math.min(pepperoniSlicesForFullPizzas, SLICES_PER_PIZZA);
        pepperoniSlicesForFullPizzas -= slicesForThisPizza;

        const svg = createPizzaSVG('pepperoni', slicesForThisPizza);
        pizzaContainer.appendChild(svg);

        const label = document.createElement('span');
        label.className = 'pizza-label';
        label.textContent = `Pepperoni #${i + 1} (${slicesForThisPizza}/12)`;
        pizzaContainer.appendChild(label);

        container.appendChild(pizzaContainer);
    }

    // Create half pizzas
    if (halfPizzas > 0) {
        let cheeseRemaining = halfPizzaCheeseSlices;
        let pepperoniRemaining = halfPizzaPepperoniSlices;

        for (let i = 0; i < halfPizzas; i++) {
            const pizzaContainer = document.createElement('div');
            pizzaContainer.className = 'pizza-container';

            // Calculate slices for this half pizza
            const pepperoniForThis = Math.min(pepperoniRemaining, 6);
            const cheeseForThis = Math.min(cheeseRemaining, 6);
            pepperoniRemaining -= pepperoniForThis;
            cheeseRemaining -= cheeseForThis;

            const svg = createHalfPizzaSVG(pepperoniForThis, cheeseForThis);
            pizzaContainer.appendChild(svg);

            const label = document.createElement('span');
            label.className = 'pizza-label';
            label.textContent = `Half & Half #${i + 1}`;
            pizzaContainer.appendChild(label);

            container.appendChild(pizzaContainer);
        }
    }
}

// Create a half-and-half pizza SVG
function createHalfPizzaSVG(pepperoniSlices, cheeseSlices) {
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", "0 0 100 100");
    svg.setAttribute("class", "pizza-svg");

    const centerX = 50;
    const centerY = 50;
    const radius = 45;
    const innerRadius = 8;

    // Create crust circle (background)
    const crust = document.createElementNS(svgNS, "circle");
    crust.setAttribute("cx", centerX);
    crust.setAttribute("cy", centerY);
    crust.setAttribute("r", radius);
    crust.setAttribute("class", "pizza-crust");
    svg.appendChild(crust);

    // Create 12 slices - first 6 pepperoni side, last 6 cheese side
    for (let i = 0; i < 12; i++) {
        const slice = document.createElementNS(svgNS, "path");
        slice.setAttribute("d", createSlicePath(i, 12, radius - 3, centerX, centerY));
        slice.setAttribute("class", "pizza-slice");

        if (i < 6) {
            // Pepperoni half
            slice.classList.add(i < pepperoniSlices ? 'slice-pepperoni' : 'slice-empty');
        } else {
            // Cheese half
            slice.classList.add((i - 6) < cheeseSlices ? 'slice-cheese' : 'slice-empty');
        }

        svg.appendChild(slice);
    }

    // Add center circle
    const center = document.createElementNS(svgNS, "circle");
    center.setAttribute("cx", centerX);
    center.setAttribute("cy", centerY);
    center.setAttribute("r", innerRadius);
    center.setAttribute("class", "pizza-center");
    svg.appendChild(center);

    // Add cut lines
    for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 6 - Math.PI / 2;
        const line = document.createElementNS(svgNS, "line");
        line.setAttribute("x1", centerX + innerRadius * Math.cos(angle));
        line.setAttribute("y1", centerY + innerRadius * Math.sin(angle));
        line.setAttribute("x2", centerX + (radius - 3) * Math.cos(angle));
        line.setAttribute("y2", centerY + (radius - 3) * Math.sin(angle));
        line.setAttribute("stroke", "#8B4513");
        line.setAttribute("stroke-width", "1");
        svg.appendChild(line);
    }

    return svg;
}