const API_BASE = "https://localhost:3000";

export async function apiGet(url) {
    const res = await fetch(API_BASE + url, { credentials: "include" });
    return res.json();
}

export async function apiPost(url, data) {
    const res = await fetch(API_BASE + url, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
    return res.json();
}

export async function apiPut(url, data) {
    const res = await fetch(API_BASE + url, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
    return res.json();
}

export async function apiDelete(url) {
    const res = await fetch(API_BASE + url, {
        method: "DELETE",
        credentials: "include"
    });
    return res.json();
}
