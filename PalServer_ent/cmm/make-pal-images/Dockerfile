FROM debian:bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive
ENV STEAM_APP_ID=2394010
ENV SERVER_DIR=/home/steam/palworld
ENV STEAMCMD_DIR=/home/steam/steamcmd
ENV STEAM_HOME=/home/steam

# --------------------------------------------------
# OS 
# -------------------------------------------------- 
RUN dpkg --add-architecture i386 && \
    apt-get update && apt-get install -y \
    ca-certificates \
    wget \
    curl \
    unzip \
    lib32gcc-s1 \
    lib32stdc++6 \
    libssl3 \
    libcurl4 \
    locales \
    file \
    tree \
    procps \
    bash \
    && rm -rf /var/lib/apt/lists/*

# --------------------------------------------------
# steam  (uid 1000 )
# --------------------------------------------------
RUN sed -i 's/# en_US.UTF-8 UTF-8/en_US.UTF-8 UTF-8/' /etc/locale.gen && \
    locale-gen
ENV LANG=en_US.UTF-8
ENV LC_ALL=en_US.UTF-8
 
### 3. steam  
RUN useradd -m -u 1000 steam

# --------------------------------------------------
#  
# --------------------------------------------------
RUN mkdir -p $SERVER_DIR $STEAMCMD_DIR \
 && chown -R steam:steam /home/steam


USER steam
WORKDIR /home/steam


# --------------------------------------------------
# SteamCMD 
# --------------------------------------------------
RUN curl -fsSL https://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz \
    | tar -xz -C $STEAMCMD_DIR


# --------------------------------------------------
# Palworld   (BUILD TIME)
# --------------------------------------------------
 
RUN $STEAMCMD_DIR/steamcmd.sh +force_install_dir $SERVER_DIR \
      +login anonymous \
      +app_update $STEAM_APP_ID  validate \
      +quit

############################################
# STEAM Cache clear  ()
############################################
 
RUN rm -rf $STEAM_HOME/.steam/*
RUN rm -rf $STEAM_HOME/Steam/*
RUN rm -rf $STEAM_HOME/.local/share/Steam/*
RUN rm -rf $STEAM_HOME/steamcmd/steamapps/downloading/*
RUN rm -rf $STEAM_HOME/steamcmd/package/*   

# --------------------------------------------------
# entrypoint
# --------------------------------------------------
COPY --chown=steam:steam entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8211/udp
EXPOSE 27015/udp

ENTRYPOINT ["/entrypoint.sh"]



 