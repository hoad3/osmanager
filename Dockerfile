FROM mcr.microsoft.com/dotnet/aspnet:8.0.13-alpine3.20 AS base
USER $APP_UID
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

# ---------- Build Frontend (Vite) ----------
FROM node:18-alpine AS frontend
WORKDIR /src/ClientApp

# Cài dependency
COPY OSManager/ClientApp/package*.json ./
RUN npm install

# Copy toàn bộ frontend mã nguồn
COPY OSManager/ClientApp ./

# Build React app → output sẽ vào dist/
RUN npm run build


FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["OSManager/OSManager.csproj", "OSManager/"]
RUN dotnet restore "OSManager/OSManager.csproj"
COPY . .
WORKDIR "/src/OSManager"
RUN dotnet build "OSManager.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "OSManager.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .

# ✅ Copy React build output vào wwwroot
COPY --from=frontend /src/ClientApp/dist ./wwwroot

ENTRYPOINT ["dotnet", "OSManager.dll"]
