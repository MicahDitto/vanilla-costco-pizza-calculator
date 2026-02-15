// Constants
const SLICES_PER_PIZZA = 12;
const COST_PER_PIZZA = 10.53;

// Store orders in an array
let orders = [];

// Track editing state
let editingOrderId = null;

// DOM elements
document.addEventListener('DOMContentLoaded', function() {
    // Get form and attach submit event
    const orderForm = document.getElementById('orderForm');
    orderForm.addEventListener('submit', addOrder);

    // Attach cancel button event
    const cancelBtn = document.getElementById('cancelEdit');
    cancelBtn.addEventListener('click', cancelEdit);

    // Load orders from localStorage if available
    loadOrders();
});

// Add or update an order
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

    if (editingOrderId !== null) {
        // Update existing order
        const orderIndex = orders.findIndex(order => order.id === editingOrderId);
        if (orderIndex !== -1) {
            const wasAlreadyPaid = orders[orderIndex].paid;
            orders[orderIndex] = {
                id: editingOrderId,
                name: name,
                cheese_slices: cheeseSlices,
                pepperoni_slices: pepperoniSlices,
                paid: paid
            };
            // Check for first to pay (only if they weren't already paid)
            if (paid && !wasAlreadyPaid && firstToPaidOrderId === null) {
                firstToPaidOrderId = editingOrderId;
                firstToPaidTitle = FIRST_TO_PAY_TITLES[Math.floor(Math.random() * FIRST_TO_PAY_TITLES.length)];
            }
        }
        // Track this as the last modified order
        lastModifiedOrderId = editingOrderId;
        // Reset editing state
        editingOrderId = null;
        document.getElementById('submitOrder').textContent = 'Add My Order';
        document.getElementById('cancelEdit').classList.remove('visible');
    } else {
        // Create a new order object
        const newOrderId = Date.now();
        const order = {
            id: newOrderId,
            name: name,
            cheese_slices: cheeseSlices,
            pepperoni_slices: pepperoniSlices,
            paid: paid
        };

        // Add order to array
        orders.push(order);
        // Track this as the last modified order
        lastModifiedOrderId = newOrderId;

        // Check for first to pay
        if (paid && firstToPaidOrderId === null) {
            firstToPaidOrderId = newOrderId;
            firstToPaidTitle = FIRST_TO_PAY_TITLES[Math.floor(Math.random() * FIRST_TO_PAY_TITLES.length)];
        }
    }

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
    // If we deleted the first-to-pay order, reset the tracking
    if (firstToPaidOrderId === id) {
        firstToPaidOrderId = null;
        firstToPaidTitle = null;
        localStorage.removeItem('firstToPaidOrderId');
        localStorage.removeItem('firstToPaidTitle');
    }
    saveOrders();
    updateOrdersTable();
    updatePizzaCalculations();
    updatePizzaVisualization();
}

// Edit an order
function editOrder(id) {
    const order = orders.find(order => order.id === id);
    if (!order) return;

    // Populate form with order data
    document.getElementById('name').value = order.name;
    document.getElementById('cheese_slices').value = order.cheese_slices;
    document.getElementById('pepperoni_slices').value = order.pepperoni_slices;
    document.getElementById('paid').checked = order.paid;

    // Set editing state
    editingOrderId = id;
    document.getElementById('submitOrder').textContent = 'Update Order';
    document.getElementById('cancelEdit').classList.add('visible');

    // Scroll to form
    document.getElementById('orderForm').scrollIntoView({ behavior: 'smooth' });
}

// Cancel editing
function cancelEdit() {
    editingOrderId = null;
    document.getElementById('submitOrder').textContent = 'Add My Order';
    document.getElementById('cancelEdit').classList.remove('visible');
    document.getElementById('orderForm').reset();
}

// Pizza champion titles (solo winner)
const PIZZA_TITLES = [
    'Pizza Tzar',
    'Pizza Prodigy',
    'The Dough-minator',
    'The Mozzarella Mogul',
    'Chief Pepperoni Officer (CPO)',
    'The Grand Vizier of the Crust',
    'Sultan of Sauce',
    'Supreme Slice Overlord',
    'Deep-Dish Deity',
    'Archduke of the Oven',
    'Pizza Polymath',
    'Patron Saint of the Pizzeria'
];

// Tie titles
const TIE_TITLES_2WAY = [
    'Dynamic Dough-o',
    'Dough Diarchy',
    'Supreme Sultan',
    'Deep Dish Duo'
];

const TIE_TITLES_3WAY = [
    'The Pizza Triumvirate',
    'The Neapolitan Trinity',
    'Pie-fecta'
];

const TIE_TITLES_4PLUS = [
    'Pizza Parliament',
    'Sauce Senator',
    'Crust Congressman',
    'Slice Syndicate'
];

// First to pay titles
const FIRST_TO_PAY_TITLES = [
    'Cash Boi',
    'Cash Slinger',
    'Quickdraw',
    'Venmo Vindicator',
    '$peedy $ender',
    'Dolla Holla',
    'Payment Prodigy'
];

// Store assigned titles - solo titles by order ID, shared titles by tie count
let assignedSoloTitles = {};
let assignedSharedTitle = { tieCount: 0, title: null };

// Track first to pay
let firstToPaidOrderId = null;
let firstToPaidTitle = null;

// Track the last order that was added/modified (for Pie Perfecter badge)
let lastModifiedOrderId = null;

// Get or assign a random title for an order based on tie count
function getTitleForOrder(orderId, tieCount) {
    if (tieCount === 1) {
        // Solo winner - each person gets their own unique title
        if (!assignedSoloTitles[orderId]) {
            assignedSoloTitles[orderId] = PIZZA_TITLES[Math.floor(Math.random() * PIZZA_TITLES.length)];
        }
        return assignedSoloTitles[orderId];
    } else {
        // Tied - all tied people share the same title
        // Regenerate if tie count changed
        if (assignedSharedTitle.tieCount !== tieCount || !assignedSharedTitle.title) {
            let titleArray;
            if (tieCount === 2) {
                titleArray = TIE_TITLES_2WAY;
            } else if (tieCount === 3) {
                titleArray = TIE_TITLES_3WAY;
            } else {
                titleArray = TIE_TITLES_4PLUS;
            }
            assignedSharedTitle = {
                tieCount: tieCount,
                title: titleArray[Math.floor(Math.random() * titleArray.length)]
            };
        }
        return assignedSharedTitle.title;
    }
}

// Update orders table
function updateOrdersTable() {
    const tableBody = document.getElementById('ordersTableBody');
    tableBody.innerHTML = '';

    const costPerSlice = calculateCostPerSlice();

    // Find the maximum slices
    let maxSlices = 0;
    orders.forEach(order => {
        const totalSlices = order.cheese_slices + order.pepperoni_slices;
        if (totalSlices > maxSlices) {
            maxSlices = totalSlices;
        }
    });

    // Find all orders tied for most slices
    const topOrderIds = [];
    if (maxSlices > 0) {
        orders.forEach(order => {
            const totalSlices = order.cheese_slices + order.pepperoni_slices;
            if (totalSlices === maxSlices) {
                topOrderIds.push(order.id);
            }
        });
    }
    const tieCount = topOrderIds.length;

    // Check if the order is perfect (no leftover slices)
    const isPerfectOrder = checkIfPerfectOrder();

    orders.forEach(order => {
        const row = document.createElement('tr');

        const totalSlices = order.cheese_slices + order.pepperoni_slices;
        const orderCost = (totalSlices * costPerSlice).toFixed(2);
        const isTopOrder = topOrderIds.includes(order.id);

        // Add highlight class if this is a top order
        if (isTopOrder) {
            row.classList.add('top-order-row');
        }

        // Build badges with tooltips
        let badges = '';
        if (isTopOrder) {
            const championTooltip = tieCount === 1
                ? 'Awarded for ordering the most slices'
                : `Awarded to ${tieCount} people tied for ordering the most slices`;
            badges += `<span class="pizza-champion-badge" title="${championTooltip}">${getTitleForOrder(order.id, tieCount)}</span>`;
        }
        // Only the person who completed the perfect order gets the Pie Perfecter badge
        if (isPerfectOrder && order.id === lastModifiedOrderId) {
            badges += `<span class="perfect-pie-badge" title="Awarded for completing a perfect order with no wasted slices">Pie Perfecter ✓</span>`;
        }
        // First to pay badge
        if (order.id === firstToPaidOrderId && order.paid) {
            badges += `<span class="first-to-pay-badge" title="Awarded for being the first to pay">${firstToPaidTitle}</span>`;
        }

        // Create name cell with optional badges
        const nameDisplay = `${order.name}${badges}`;

        row.innerHTML = `
            <td>${nameDisplay}</td>
            <td>${order.cheese_slices}</td>
            <td>${order.pepperoni_slices}</td>
            <td>${totalSlices}</td>
            <td>$${orderCost}</td>
            <td class="paid-status ${order.paid ? 'paid' : 'not-paid'}">${order.paid ? 'Yes' : 'No'}</td>
            <td>
                <button class="edit-btn" onclick="editOrder(${order.id})">Edit</button>
                <button class="delete-btn" onclick="deleteOrder(${order.id})">Delete</button>
            </td>
        `;

        tableBody.appendChild(row);
    });
}

// Check if the current order results in no leftover slices
function checkIfPerfectOrder() {
    const totalCheeseSlices = orders.reduce((sum, order) => sum + order.cheese_slices, 0);
    const totalPepperoniSlices = orders.reduce((sum, order) => sum + order.pepperoni_slices, 0);

    if (totalCheeseSlices === 0 && totalPepperoniSlices === 0) return false;

    // Calculate pizzas needed using the same logic as updatePizzaCalculations
    let cheesePizzasNeeded = Math.floor(totalCheeseSlices / SLICES_PER_PIZZA);
    let pepperoniPizzasNeeded = Math.floor(totalPepperoniSlices / SLICES_PER_PIZZA);

    let remainingCheeseSlices = totalCheeseSlices - (cheesePizzasNeeded * SLICES_PER_PIZZA);
    let remainingPepperoniSlices = totalPepperoniSlices - (pepperoniPizzasNeeded * SLICES_PER_PIZZA);

    if (remainingCheeseSlices > 6) {
        cheesePizzasNeeded += 1;
        remainingCheeseSlices = 0;
    }
    if (remainingPepperoniSlices > 6) {
        pepperoniPizzasNeeded += 1;
        remainingPepperoniSlices = 0;
    }

    let halfPizzas = 0;
    if (remainingCheeseSlices > 0 && remainingPepperoniSlices > 0) {
        halfPizzas = 1;
    } else {
        if (remainingCheeseSlices > 0) cheesePizzasNeeded += 1;
        if (remainingPepperoniSlices > 0) pepperoniPizzasNeeded += 1;
    }

    const totalCheeseCapacity = (cheesePizzasNeeded * SLICES_PER_PIZZA) + (halfPizzas * 6);
    const totalPepperoniCapacity = (pepperoniPizzasNeeded * SLICES_PER_PIZZA) + (halfPizzas * 6);
    const totalLeftover = (totalCheeseCapacity - totalCheeseSlices) + (totalPepperoniCapacity - totalPepperoniSlices);

    return totalLeftover === 0;
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

    // Update cost efficiency color and check for perfect order
    const totalLeftover = leftoverCheeseSlices + leftoverPepperoniSlices;
    updateCostEfficiencyColor(costPerSlice, totalLeftover, totalSlices);
}

// Update the cost per slice box color based on efficiency
function updateCostEfficiencyColor(costPerSlice, totalLeftover, totalSlices) {
    const costBox = document.querySelector('.stat-box.highlight');
    if (!costBox) return;

    // Remove all cost classes
    costBox.classList.remove('cost-perfect', 'cost-great', 'cost-good', 'cost-okay', 'cost-poor', 'cost-bad');

    // If no slices ordered, keep default
    if (totalSlices === 0) return;

    // Optimal cost per slice is $10.53 / 12 = ~$0.88
    const optimalCost = COST_PER_PIZZA / SLICES_PER_PIZZA;

    // Get the slogan element
    const slogan = document.getElementById('perfect-slogan');

    // Hide slogan by default
    slogan.classList.remove('visible');

    // Perfect: no leftover slices (cost equals optimal)
    if (totalLeftover === 0) {
        costBox.classList.add('cost-perfect');
        slogan.classList.add('visible');
        triggerConfetti();
    }
    // Great: cost per slice < $0.95 (less than ~8% waste)
    else if (costPerSlice < optimalCost * 1.08) {
        costBox.classList.add('cost-great');
    }
    // Good: cost per slice < $1.10 (less than ~25% waste)
    else if (costPerSlice < optimalCost * 1.25) {
        costBox.classList.add('cost-good');
    }
    // Okay: cost per slice < $1.50 (less than ~70% waste)
    else if (costPerSlice < optimalCost * 1.70) {
        costBox.classList.add('cost-okay');
    }
    // Poor: cost per slice < $2.00
    else if (costPerSlice < 2.00) {
        costBox.classList.add('cost-poor');
    }
    // Bad: cost per slice >= $2.00
    else {
        costBox.classList.add('cost-bad');
    }
}

// Trigger confetti celebration
function triggerConfetti() {
    // Remove any existing confetti container
    const existingContainer = document.querySelector('.confetti-container');
    if (existingContainer) {
        existingContainer.remove();
    }

    // Create confetti container
    const container = document.createElement('div');
    container.className = 'confetti-container';
    document.body.appendChild(container);

    // Get the cost per slice element position for confetti origin
    const costBox = document.querySelector('.stat-box.highlight');
    const rect = costBox.getBoundingClientRect();
    const originX = rect.left + rect.width / 2;
    const originY = rect.top + rect.height / 2;

    // Create confetti pieces
    const colors = ['#ff5722', '#ffeb3b', '#4caf50', '#2196f3', '#9c27b0', '#ff9800', '#e91e63', '#00bcd4'];
    const shapes = ['square', 'circle', 'triangle'];

    for (let i = 0; i < 80; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti burst';

        // Random properties
        const color = colors[Math.floor(Math.random() * colors.length)];
        const shape = shapes[Math.floor(Math.random() * shapes.length)];
        const size = Math.random() * 12 + 6;

        // Random angle for burst direction (full 360 degrees)
        const angle = Math.random() * Math.PI * 2;
        const velocity = Math.random() * 200 + 100;
        const tx = Math.cos(angle) * velocity;
        const ty = Math.sin(angle) * velocity - 150; // Bias upward

        const delay = Math.random() * 0.3;

        let borderRadius = '0';
        let clipPath = 'none';
        if (shape === 'circle') {
            borderRadius = '50%';
        } else if (shape === 'triangle') {
            clipPath = 'polygon(50% 0%, 0% 100%, 100% 100%)';
        }

        confetti.style.cssText = `
            left: ${originX}px;
            top: ${originY}px;
            width: ${size}px;
            height: ${size}px;
            background-color: ${color};
            border-radius: ${borderRadius};
            clip-path: ${clipPath};
            --tx: ${tx}px;
            --ty: ${ty}px;
            animation-delay: ${delay}s;
        `;

        container.appendChild(confetti);
    }

    // Remove container after animation
    setTimeout(() => {
        container.remove();
    }, 4000);
}

// Trigger confetti from a specific element
function triggerConfettiFromElement(element) {
    // Remove any existing confetti container
    const existingContainer = document.querySelector('.confetti-container');
    if (existingContainer) {
        existingContainer.remove();
    }

    // Create confetti container
    const container = document.createElement('div');
    container.className = 'confetti-container';
    document.body.appendChild(container);

    // Get element position for confetti origin
    const rect = element.getBoundingClientRect();
    const originX = rect.left + rect.width / 2;
    const originY = rect.top + rect.height / 2;

    // Create confetti pieces
    const colors = ['#ff5722', '#ffeb3b', '#4caf50', '#2196f3', '#9c27b0', '#ff9800', '#e91e63', '#00bcd4'];
    const shapes = ['square', 'circle', 'triangle'];

    for (let i = 0; i < 80; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti burst';

        // Random properties
        const color = colors[Math.floor(Math.random() * colors.length)];
        const shape = shapes[Math.floor(Math.random() * shapes.length)];
        const size = Math.random() * 12 + 6;

        // Random angle for burst direction (full 360 degrees)
        const angle = Math.random() * Math.PI * 2;
        const velocity = Math.random() * 200 + 100;
        const tx = Math.cos(angle) * velocity;
        const ty = Math.sin(angle) * velocity - 150; // Bias upward

        const delay = Math.random() * 0.3;

        let borderRadius = '0';
        let clipPath = 'none';
        if (shape === 'circle') {
            borderRadius = '50%';
        } else if (shape === 'triangle') {
            clipPath = 'polygon(50% 0%, 0% 100%, 100% 100%)';
        }

        confetti.style.cssText = `
            left: ${originX}px;
            top: ${originY}px;
            width: ${size}px;
            height: ${size}px;
            background-color: ${color};
            border-radius: ${borderRadius};
            clip-path: ${clipPath};
            --tx: ${tx}px;
            --ty: ${ty}px;
            animation-delay: ${delay}s;
        `;

        container.appendChild(confetti);
    }

    // Remove container after animation
    setTimeout(() => {
        container.remove();
    }, 4000);
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
    // Save first to pay info
    if (firstToPaidOrderId !== null) {
        localStorage.setItem('firstToPaidOrderId', firstToPaidOrderId);
        localStorage.setItem('firstToPaidTitle', firstToPaidTitle);
    }
}

// Load orders from localStorage
function loadOrders() {
    const savedOrders = localStorage.getItem('pizzaOrders');
    if (savedOrders) {
        orders = JSON.parse(savedOrders);
        updateOrdersTable();
        updatePizzaCalculations();
    }
    // Load first to pay info
    const savedFirstToPaidId = localStorage.getItem('firstToPaidOrderId');
    const savedFirstToPaidTitle = localStorage.getItem('firstToPaidTitle');
    if (savedFirstToPaidId && savedFirstToPaidTitle) {
        firstToPaidOrderId = parseInt(savedFirstToPaidId);
        firstToPaidTitle = savedFirstToPaidTitle;
        // Verify the order still exists
        const orderExists = orders.some(order => order.id === firstToPaidOrderId && order.paid);
        if (!orderExists) {
            firstToPaidOrderId = null;
            firstToPaidTitle = null;
            localStorage.removeItem('firstToPaidOrderId');
            localStorage.removeItem('firstToPaidTitle');
        }
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

    // Calculate total leftover slices for "Perfect Pies!" message
    const totalCheeseCapacity = (cheesePizzasNeeded * SLICES_PER_PIZZA) + (halfPizzas * 6);
    const totalPepperoniCapacity = (pepperoniPizzasNeeded * SLICES_PER_PIZZA) + (halfPizzas * 6);
    const totalLeftover = (totalCheeseCapacity - totalCheeseSlices) + (totalPepperoniCapacity - totalPepperoniSlices);

    // Add "Perfect Pies!" message if no leftover slices
    if (totalLeftover === 0 && (totalCheeseSlices > 0 || totalPepperoniSlices > 0)) {
        const perfectMessage = document.createElement('div');
        perfectMessage.className = 'perfect-pies-message';
        perfectMessage.innerHTML = 'Perfect Pies! ✓';
        container.appendChild(perfectMessage);

        // Trigger confetti from pizza visualization
        triggerConfettiFromElement(container);
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