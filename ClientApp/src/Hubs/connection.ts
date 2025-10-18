import {HttpTransportType, HubConnectionBuilder} from "@microsoft/signalr";
// import { loadEnv } from 'vite'
// import path from "path";
// const API_BASE_URL = '/api/performanceHub'
// const envDir = path.resolve(__dirname, '..')
// const env = loadEnv(envDir,'')
// const apiUrl = env.VITE_API_URL || env.API_URL
const url = import.meta.env.VITE_API_URL as string | undefined;

function getBaseUrl() {
    const baseFromEnv = (url && url !== "undefined") ? url.replace(/\/+$/, "") : "";
    const baseFromHtmlBase = document.querySelector('base')?.getAttribute('href') ?? "";
    const origin = window.location.origin + (baseFromHtmlBase || "");
    return baseFromEnv || origin.replace(/\/+$/, "");
}

export function createPerformanceConnection() {
    const tokenData = JSON.parse(localStorage.getItem("authTokens") ?? "{}");
    const jwtToken = tokenData.jwtToken || "";
    const hubUrl = `${getBaseUrl()}/performancehub`;
    return new HubConnectionBuilder()
        .withUrl(hubUrl, {
            withCredentials: true,
            accessTokenFactory: () => jwtToken,
            transport: HttpTransportType.WebSockets
        })
        .withAutomaticReconnect()
        .build();
}
export function createFolderConnectioṇ̣̣(){
    const tokenData = JSON.parse(localStorage.getItem("authTokens") ?? "{}");
    const jwtToken = tokenData.jwtToken || "";
    const hubUrl = `${getBaseUrl()}/folderhubs`;
    return new HubConnectionBuilder()
    .withUrl(hubUrl, {
        withCredentials: true,
        accessTokenFactory: () => jwtToken,
        transport: HttpTransportType.WebSockets
    })
    .withAutomaticReconnect()
    .build();
}

export function deleteFolderConnection(){
    const tokenData = JSON.parse(localStorage.getItem("authTokens") ?? "{}");
    const jwtToken = tokenData.jwtToken || "";
    const hubUrl = `${getBaseUrl()}/folderhubs`;
    return new HubConnectionBuilder()
    .withUrl(hubUrl, {
        withCredentials: true,
        accessTokenFactory: () => jwtToken,
        transport: HttpTransportType.WebSockets
        })
        .withAutomaticReconnect()
        .build();
}

export function renameFolderConnection(){
    const tokenData = JSON.parse(localStorage.getItem("authTokens") ?? "{}");
    const jwtToken = tokenData.jwtToken || "";
    const hubUrl = `${getBaseUrl()}/rename`;
    console.log("Connecting to rename folder:", hubUrl);
    return new HubConnectionBuilder()
        .withUrl(hubUrl, {
            withCredentials: true,
            accessTokenFactory: () => jwtToken,
            transport: HttpTransportType.WebSockets
        })
        .withAutomaticReconnect()
        .build()
}
