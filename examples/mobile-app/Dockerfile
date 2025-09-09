# Dockerfile para desenvolvimento React Native
FROM node:18-alpine

# Instalar dependências do sistema
RUN apk add --no-cache \
    openjdk11-jre \
    android-tools \
    bash \
    git \
    python3 \
    make \
    g++ \
    nginx

# Definir variáveis de ambiente para Android
ENV ANDROID_HOME=/opt/android-sdk
ENV PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools

# Criar diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm install

# Instalar React Native CLI globalmente
RUN npm install -g @react-native-community/cli

# Copiar código fonte
COPY . .

# Criar página web para demonstração
RUN mkdir -p /var/www/html
COPY public/index.html /var/www/html/index.html

# Configurar nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Expor portas
EXPOSE 8081
EXPOSE 19006

# Configurar variáveis de ambiente para desenvolvimento
ENV EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
ENV REACT_NATIVE_PACKAGER_HOSTNAME=0.0.0.0

# Criar script de inicialização
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Comando para iniciar ambos os serviços
CMD ["/start.sh"]