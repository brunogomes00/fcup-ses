function clearDiv(e) {
    //e.firstElementChild can be used.
    var child = e.lastElementChild;
    while (child) {
        e.removeChild(child);
        child = e.lastElementChild;
    }
}

document.getElementById("squareroot").onclick = function () {
    clearDiv(document.getElementById("input"));
    let div = document.getElementById("input");

    // Create a form synamically
    let form = document.createElement("form");
    let root_value = document.createElement("input");
    root_value.setAttribute("type", "number");
    root_value.setAttribute("name", "root_value");
    let newLabel = document.createElement("label");
    newLabel.setAttribute("for", "root_value")
    newLabel.appendChild(document.createTextNode("Root Value"))
    let s = document.createElement("input");
    s.setAttribute("type", "submit");
    s.setAttribute("value", "Submit");
    form.appendChild(newLabel);
    form.appendChild(root_value);
    form.appendChild(document.createElement("br"))
    form.appendChild(s);
    form.addEventListener('submit', function (event) {
        event.preventDefault();
        const data = new URLSearchParams();
        for (const pair of new FormData(event.target)) {
            data.append(pair[0], pair[1]);
        }
        fetch('/root_value', {
            method: 'POST',
            body: data,
        }).then(async function (response) {
            if (response.ok) {
                return response.json();
            }
            let el = document.createElement("h3");
            el.style.color = "red"
            el.textContent = await response.text();
            div.appendChild(el);
            return Promise.reject(response);
        }).then(function (data) {
            clearDiv(form)
            let resultDiv = document.createElement("div");
            resultDiv.appendChild(document.createElement("BR"));
            resultDiv.appendChild(document.createTextNode("Result = " + data));
            form.appendChild(resultDiv);
        }).catch((error) => {

        });
    });

    div.appendChild(form);
};
document.getElementById("cubicroot").onclick = function () {
    clearDiv(document.getElementById("input"));
    let div = document.getElementById("input");

    // Create a form synamically
    let form = document.createElement("form");
    let cubic_value = document.createElement("input");
    cubic_value.setAttribute("type", "number");
    cubic_value.setAttribute("name", "cubic_value");
    let newLabel = document.createElement("label");
    newLabel.setAttribute("for", "cubic_value")
    newLabel.appendChild(document.createTextNode("Cubic Value"))
    let s = document.createElement("input");
    s.setAttribute("type", "submit");
    s.setAttribute("value", "Submit");
    form.appendChild(newLabel);
    form.appendChild(cubic_value);
    form.appendChild(document.createElement("br"))
    form.appendChild(s);
    form.addEventListener('submit', function (event) {
        event.preventDefault();
        const data = new URLSearchParams();
        for (const pair of new FormData(event.target)) {
            data.append(pair[0], pair[1]);
        }
        fetch('/cubic_value', {
            method: 'POST',
            body: data,
        }).then(async function (response) {
            if (response.ok) {
                return response.json();
            }
            let el = document.createElement("h3");
            el.style.color = "red"
            el.textContent = await response.text();
            div.appendChild(el);
            return Promise.reject(response);
        }).then(function (data) {
            clearDiv(form)
            let resultDiv = document.createElement("div");
            resultDiv.appendChild(document.createElement("BR"));
            resultDiv.appendChild(document.createTextNode("Result = " + data));
            form.appendChild(resultDiv);
        }).catch((error) => {

        });
    });

    div.appendChild(form);

};
document.getElementById("nroot").onclick = function () {
    clearDiv(document.getElementById("input"));
    let div = document.getElementById("input");

    // Create a form synamically
    let form = document.createElement("form");
    let root_value = document.createElement("input");
    root_value.setAttribute("type", "number");
    root_value.setAttribute("name", "root");
    let newLabel = document.createElement("label");
    newLabel.setAttribute("for", "root")
    newLabel.appendChild(document.createTextNode("N Root"))
    let root_value2 = document.createElement("input");
    root_value2.setAttribute("type", "number");
    root_value2.setAttribute("name", "value");
    let newLabel2 = document.createElement("label");
    newLabel2.setAttribute("for", "value")
    newLabel2.appendChild(document.createTextNode("Value"))
    let s = document.createElement("input");
    s.setAttribute("type", "submit");
    s.setAttribute("value", "Submit");
    form.appendChild(newLabel);
    form.appendChild(root_value);
    form.appendChild(document.createElement("br"))
    form.appendChild(newLabel2);
    form.appendChild(root_value2);
    form.appendChild(document.createElement("br"))
    form.appendChild(s);
    form.addEventListener('submit', function (event) {
        event.preventDefault();
        const data = new URLSearchParams();
        for (const pair of new FormData(event.target)) {
            data.append(pair[0], pair[1]);
        }
        fetch('/n_root_value', {
            method: 'POST',
            body: data,
        }).then(async function (response) {
            console.log(response)
            if (response.ok) {
                return response.json();
            }
            let el = document.createElement("h3");
            el.style.color = "red"
            el.textContent = await response.text();
            div.appendChild(el);
            return Promise.reject(response);
        }).then(function (data) {
            console.log(data)
            clearDiv(form)
            let resultDiv = document.createElement("div");
            resultDiv.appendChild(document.createElement("BR"));
            resultDiv.appendChild(document.createTextNode("Result = " + data));
            form.appendChild(resultDiv);
        }).catch((error) => {
            console.log(error)
        });
    });

    div.appendChild(form);

};
document.getElementById("listusers").onclick = function () {
    let div = document.getElementById("input");

    fetch('/list_users', {
        method: 'GET'
    }).then(async function (response) {
        if (response.ok) {
            return response.json();
        }
        let el = document.createElement("h3");
        el.style.color = "red"
        el.textContent = await response.text();
        div.appendChild(el);
        return Promise.reject(response);
    }).then(async function (data) {
        clearDiv(div)

        if (data.length === 0) {
            const temp = document.createElement("div");
            temp.appendChild(document.createTextNode("No Users available"));
            div.appendChild(document.createElement("br"))
            div.appendChild(temp);
            return;
        }

        function generateTableHead(table, data) {
            let thead = table.createTHead();
            let row = thead.insertRow();
            for (let key of data) {
                if (key === "certificate" || key === "ip") continue;
                let th = document.createElement("th");
                let text = document.createTextNode(key.toUpperCase());
                th.appendChild(text);
                row.appendChild(th);
            }
        }

        function generateTable(table, data) {
            for (let element of data) {
                let row = table.insertRow();
                for (let key in element) {
                    if (key === "certificate" || key === "ip") continue;
                    let cell = row.insertCell();
                    let text = document.createTextNode(element[key]);
                    cell.appendChild(text);
                }
                let cell = row.insertCell();
                let button = document.createElement("button");
                button.innerHTML = "Select";
                button.addEventListener("click", function () {
                    const user = data[this.parentNode.parentNode.rowIndex - 1];
                    let textarea = document.createElement("textarea");
                    textarea.setAttribute("rows", 8)
                    textarea.setAttribute("cols", 50)
                    div.appendChild(textarea);
                    button.remove();

                    let button_send = document.createElement("button");
                    button_send.innerHTML = "Send Message";
                    button_send.addEventListener("click", function () {

                        fetch('/send_message?' + new URLSearchParams({
                            ip: user.ip,
                            port: user.port,
                            certificate: user.certificate,
                            message: textarea.value,
                            username: user.username
                        }), {
                            method: 'GET'
                        }).then(async function (response) {
                            if (response.ok) {
                                clearDiv(div)
                                const temp = document.createElement("div");
                                temp.appendChild(document.createTextNode("Message Delivered Successfully"));
                                div.appendChild(document.createElement("br"))
                                div.appendChild(temp);
                                return response.text();

                            }
                            clearDiv(div)
                            let el = document.createElement("h3");
                            el.style.color = "red"
                            el.textContent = await response.text();
                            div.appendChild(el);
                            return Promise.reject(response);
                        }).then(function (data) {

                        }).catch((error) => {

                        });;
                    });
                    div.appendChild(document.createElement("br"))
                    div.appendChild(button_send)

                });
                cell.appendChild(button);

            }
        }

        let table = document.createElement("table");
        let info_users = Object.keys(data[0]);
        generateTableHead(table, info_users);
        generateTable(table, data);

        let resultDiv = document.createElement("div");
        resultDiv.appendChild(document.createElement("BR"));
        resultDiv.appendChild(table);
        div.appendChild(resultDiv);
    }).catch((error) => {

    });

};
document.getElementById("received").onclick = function () {

    let div = document.getElementById("input");

    fetch('/received', {
        method: 'GET'
    }).then(async function (response) {
        if (response.ok) {
            return response.json();
        }

        let el = document.createElement("h3");
        el.style.color = "red"
        el.textContent = await response.text();
        div.appendChild(el);
        return Promise.reject(response);
    }).then(function (data) {
        clearDiv(div);
        if (data.length === 0) {
            const temp = document.createElement("div");
            temp.appendChild(document.createTextNode("No Messages Received"));
            div.appendChild(document.createElement("br"))
            div.appendChild(temp);
            return;
        }

        function generateTableHead(table, data) {
            let thead = table.createTHead();
            let row = thead.insertRow();
            for (let key of data) {
                let th = document.createElement("th");
                let text = document.createTextNode(key.toUpperCase());
                th.appendChild(text);
                row.appendChild(th);
            }
        }

        function generateTable(table, data) {
            for (let element of data) {
                let row = table.insertRow();
                for (key in element) {
                    let cell = row.insertCell();
                    let text = document.createTextNode(element[key]);
                    cell.appendChild(text);
                }
            }
        }

        let table = document.createElement("table");
        let info_users = Object.keys(data[0]);
        generateTableHead(table, info_users);
        generateTable(table, data);

        let resultDiv = document.createElement("div");
        resultDiv.appendChild(document.createElement("BR"));
        resultDiv.appendChild(table);
        div.appendChild(resultDiv);
    }).catch((error) => {

    });;
};

document.getElementById("sent").onclick = function () {

    let div = document.getElementById("input");

    fetch('/sent', {
        method: 'GET'
    }).then(async function (response) {
        if (response.ok) {
            return response.json();
        }

        let el = document.createElement("h3");
        el.style.color = "red"
        el.textContent = await response.text();
        div.appendChild(el);
        return Promise.reject(response);
    }).then(function (data) {
        clearDiv(div);
        if (data.length === 0) {
            const temp = document.createElement("div");
            temp.appendChild(document.createTextNode("No Messages Received"));
            div.appendChild(document.createElement("br"))
            div.appendChild(temp);
            return;
        }

        function generateTableHead(table, data) {
            let thead = table.createTHead();
            let row = thead.insertRow();
            for (let key of data) {
                let th = document.createElement("th");
                let text = document.createTextNode(key.toUpperCase());
                th.appendChild(text);
                row.appendChild(th);
            }
        }

        function generateTable(table, data) {
            for (let element of data) {
                let row = table.insertRow();
                for (key in element) {
                    let cell = row.insertCell();
                    let text = document.createTextNode(element[key]);
                    cell.appendChild(text);
                }
            }
        }

        let table = document.createElement("table");
        let info_users = Object.keys(data[0]);
        generateTableHead(table, info_users);
        generateTable(table, data);

        let resultDiv = document.createElement("div");
        resultDiv.appendChild(document.createElement("BR"));
        resultDiv.appendChild(table);
        div.appendChild(resultDiv);
    }).catch((error) => {

    });
};

document.getElementById("exit").onclick = function () {

    fetch('/close', {
        method: 'GET'
    }).then(function (response) {
        window.close();
    }).catch((error) => {

    });

};