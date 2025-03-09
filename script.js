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

    // Reset form
    orderForm.reset();
}

// Delete an order
function deleteOrder(id) {
    orders = orders.filter(order => order.id !== id);
    saveOrders();
    updateOrdersTable();
    updatePizzaCalculations();
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

    // Calculate pizzas needed
    let cheesePizzasNeeded = Math.ceil(totalCheeseSlices / SLICES_PER_PIZZA);
    let pepperoniPizzasNeeded = Math.ceil(totalPepperoniSlices / SLICES_PER_PIZZA);

    // Calculate leftover slices
    const leftoverCheeseSlices = (cheesePizzasNeeded * SLICES_PER_PIZZA) - totalCheeseSlices;
    const leftoverPepperoniSlices = (pepperoniPizzasNeeded * SLICES_PER_PIZZA) - totalPepperoniSlices;

    // Half pizza optimization
    let halfPizzas = 0;

    if ((leftoverCheeseSlices <= 6 && leftoverPepperoniSlices <= 6) ||
        (leftoverCheeseSlices >= 6 && leftoverPepperoniSlices >= 6)) {
        if (cheesePizzasNeeded > 0 && pepperoniPizzasNeeded > 0) {
            cheesePizzasNeeded -= 1;
            pepperoniPizzasNeeded -= 1;
            halfPizzas += 2;
        }
    }

    // Calculate total pizzas and cost
    const totalPizzas = cheesePizzasNeeded + pepperoniPizzasNeeded + (halfPizzas * 0.5);
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

    let cheesePizzasNeeded = Math.ceil(totalCheeseSlices / SLICES_PER_PIZZA);
    let pepperoniPizzasNeeded = Math.ceil(totalPepperoniSlices / SLICES_PER_PIZZA);

    const leftoverCheeseSlices = (cheesePizzasNeeded * SLICES_PER_PIZZA) - totalCheeseSlices;
    const leftoverPepperoniSlices = (pepperoniPizzasNeeded * SLICES_PER_PIZZA) - totalPepperoniSlices;

    let halfPizzas = 0;

    if ((leftoverCheeseSlices <= 6 && leftoverPepperoniSlices <= 6) ||
        (leftoverCheeseSlices >= 6 && leftoverPepperoniSlices >= 6)) {
        if (cheesePizzasNeeded > 0 && pepperoniPizzasNeeded > 0) {
            cheesePizzasNeeded -= 1;
            pepperoniPizzasNeeded -= 1;
            halfPizzas += 2;
        }
    }

    const totalPizzas = cheesePizzasNeeded + pepperoniPizzasNeeded + (halfPizzas * 0.5);
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
}