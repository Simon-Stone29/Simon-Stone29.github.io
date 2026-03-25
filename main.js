"use strict";

function init() {
    let btn = document.getElementById("fetch-btn");
    btn.addEventListener("click", fetchDog);
    let mealBtn = document.getElementById("meal-btn");
    mealBtn.addEventListener("click", fetchMeal);
    let jokeBtn = document.getElementById("joke-btn");
    jokeBtn.addEventListener("click", fetchJoke);
}

function fetchDog() {
    let url = "https://dog.ceo/api/breeds/image/random";
    fetch(url)
        .then(statusCheck)
        .then(resp => resp.json())
        .then(showDog)
        .catch(handleError);
}

function showDog(data) {
    console.log("Dog data:", data);
    let img = document.createElement("img");
    img.src = data.message;
    img.alt = "A random dog";
    document.getElementById("output").appendChild(img);
}

async function statusCheck(res) {
    if (!res.ok) {
        throw new Error(await res.text());
    }
    return res;
}

function handleError(err) {
    console.error("Something went wrong:", err);
    document.getElementById("output").textContent =
        "The kitchen is closed! (Error loading data)";
}

init();

function fetchMeal() {
    let food = document.getElementById("food-input").value;
    let url = "https://www.themealdb.com/api/json/v1/1/search.php?s=" + food;
    fetch(url)
        .then(statusCheck)
        .then(resp => resp.json())
        .then(showMeals)
        .catch(handleError);
}

function showMeals(data) {
    let output = document.getElementById("meal-output");
    output.replaceChildren();

    if (data.meals === null) {
        let error = document.createTextNode("Sorry, we don't have that on the menu");
        output.appendChild(error);
    } else {
        for (let i = 0; i < data.meals.length; i++) {

            console.log(data.meals[i]);

            let title = document.createTextNode(data.meals[i].strMeal);
            output.appendChild(title);

            let category = document.createTextNode(data.meals[i].strCategory);
            output.appendChild(category);

            let img = document.createElement("img");
            img.src = data.meals[i].strMealThumb;
            img.alt = "A random dog";
            output.appendChild(img);

        }
    }
}

function fetchJoke() {
    let url = "https://official-joke-api.appspot.com/random_joke";
    fetch(url)
        .then(resp => resp.json())
        .then(showJoke)
        .catch(handleError);
}

function showJoke(data) {
    console.log(data);
    let output = document.getElementById("joke-output");
    output.replaceChildren();
    let setup = document.createTextNode(data.setup);
    let punchline = document.createTextNode(data.punchline);
    output.appendChild(setup);
    setTimeout(() => {
        output.appendChild(punchline);
    }, 3000);
}