import {HttpTransportType, HubConnectionBuilder} from "@microsoft/signalr";
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

export function dockerConnection(){
    const tokenData = JSON.parse(localStorage.getItem("authTokens") ?? "{}");
    const jwtToken = tokenData.jwtToken || "";
    const hubUrl = `${getBaseUrl()}/dockerHub`;
    return new HubConnectionBuilder()
        .withUrl(hubUrl, {
            withCredentials: true,
            accessTokenFactory: () => jwtToken,
            transport: HttpTransportType.WebSockets
        })
        .withAutomaticReconnect()
        .build();
}

export function fileConnection(){
    const tokenData = JSON.parse(localStorage.getItem("authTokens") ?? "{}");
    const jwtToken = tokenData.jwtToken || "";
    const hubUrl = `${getBaseUrl()}/filehubs`;
    return new HubConnectionBuilder()
        .withUrl(hubUrl, {
            withCredentials: true,
            accessTokenFactory: () => jwtToken,
            transport: HttpTransportType.WebSockets
        })
        .withAutomaticReconnect()
        .build();
}

export function UploadConnection(){
    const tokenData = JSON.parse(localStorage.getItem("authTokens") ?? "{}");
    const jwtToken = tokenData.jwtToken || "";
    const hubUrl = `${getBaseUrl()}/uploadhubs`;
    return new HubConnectionBuilder()
        .withUrl(hubUrl, {
            withCredentials: true,
            accessTokenFactory: () => jwtToken,
            transport: HttpTransportType.WebSockets
        })
        .withAutomaticReconnect()
        .build();
}