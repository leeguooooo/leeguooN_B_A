const { createApp, ref, computed, watch, onMounted, onUnmounted, nextTick } = Vue;

function convertGameTimeToDate(gameTime) {
  const currentDate = new Date();
  const adjustedDate = new Date(currentDate.getTime() - 6 * 60 * 60 * 1000);
  const currentYear = adjustedDate.getFullYear();
  const [month, day, time] = gameTime.split(/-| /);
  const [hour, minute] = time.split(':');
  return new Date(currentYear, month - 1, day, hour, minute);
}

async function fetchGames(games, isLoading) {
  try {
    const response = await fetch('/api/games');
    if (response.ok) {
      const gameData = await response.json();
      games.value = gameData;
    } else {
      console.error('获取比赛信息错误:', response.statusText);
    }
  } catch (error) {
    console.error('获取比赛信息错误:', error.message);
  } finally {
    isLoading.value = false;
  }
}

async function fetchLiveLinks(url) {
  try {
    const response = await fetch(
      `/api/parseLiveLinks?url=${encodeURIComponent(url)}`
    );
    if (response.ok) {
      const liveLinks = await response.json();
      return liveLinks;
    } else {
      console.error('获取直播链接错误:', response.statusText);
    }
  } catch (error) {
    console.error('获取直播链接错误:', error.message);
  }
  return [];
}

const app = createApp({
  setup() {
    const games = ref([]);
    const isLoading = ref(true);
    const showModal = ref(false);
    const modalLinks = ref([]);

    fetchGames(games, isLoading).then(() => {
      selectedLeagues.value.forEach(leagueId => {
        checkAndDeselectLeague(leagueId);
      });
    });

    const selectedLeagues = ref(['NBA']);

    const leagues = ref([
      { id: 'NBA', name: '只看 NBA' },

      // 添加其他联盟对象
    ]);

    const checkAndDeselectLeague = leagueId => {
      const gamesInLeague = filteredGames.value.filter(
        game => game.league === leagueId
      );
      if (gamesInLeague.length === 0) {
        selectedLeagues.value = selectedLeagues.value.filter(
          id => id !== leagueId
        );
      }
    };

    const filteredGames = computed(() => {
      const now = new Date();

      // const visibleGames = games.value.filter(game => {
      //   const gameTime = convertGameTimeToDate(game.gameTime);
      //   return gameTime >= now;
      // });

      const visibleGames = games.value.sort((a, b) => {
        const gameTimeA = convertGameTimeToDate(a.gameTime);
        const gameTimeB = convertGameTimeToDate(b.gameTime);
        return gameTimeA - gameTimeB;
      });

      return visibleGames.filter(game =>
        selectedLeagues.value.length === 0
          ? true
          : selectedLeagues.value.includes(game.league)
      );
    });

    const groupedGames = computed(() => {
      const gamesByDate = filteredGames.value.reduce((grouped, game) => {
        const date = game.gameTime.split(' ')[0];
        if (!grouped[date]) {
          grouped[date] = [];
        }
        grouped[date].push(game);
        return grouped;
      }, {});

      return gamesByDate;
    });

    const openLiveLink = async url => {
      const liveLinks = await fetchLiveLinks(url);
      const targetLink = liveLinks.find(link =>
        link.name.includes('中文高清 Q')
      );

      if (targetLink) {
        window.open(targetLink.url, '_self');
      } else {
        showModal.value = true;
        modalLinks.value = liveLinks;
      }
    };

    const openLink = url => {
      window.open(url, '_self');
      showModal.value = false;
    };

    // TV Navigation System
    const currentFocus = ref(null);
    const focusableElements = ref([]);

    const initializeFocusableElements = () => {
      focusableElements.value = Array.from(document.querySelectorAll('.focusable'));
      if (focusableElements.value.length > 0) {
        focusableElements.value[0].focus();
        currentFocus.value = 0;
      }
    };

    const handleKeyNavigation = (event) => {
      if (!focusableElements.value.length) return;

      const currentElement = focusableElements.value[currentFocus.value];
      let nextIndex = currentFocus.value;

      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault();
          nextIndex = Math.max(0, currentFocus.value - 1);
          break;
        case 'ArrowDown':
          event.preventDefault();
          nextIndex = Math.min(focusableElements.value.length - 1, currentFocus.value + 1);
          break;
        case 'Enter':
          event.preventDefault();
          currentElement.click();
          break;
        case 'Escape':
          if (showModal.value) {
            showModal.value = false;
          }
          break;
      }

      if (nextIndex !== currentFocus.value) {
        currentFocus.value = nextIndex;
        focusableElements.value[nextIndex].focus();
      }
    };

    // Watch for changes in the DOM that might affect focusable elements
    watch([games, showModal], () => {
      nextTick(() => {
        initializeFocusableElements();
      });
    });

    // Mount keyboard navigation
    onMounted(() => {
      window.addEventListener('keydown', handleKeyNavigation);
      initializeFocusableElements();
    });

    onUnmounted(() => {
      window.removeEventListener('keydown', handleKeyNavigation);
    });

    return {
      games,
      isLoading,
      showModal,
      modalLinks,
      selectedLeagues,
      leagues,
      groupedGames,
      openLiveLink: async (url) => {
        const links = await fetchLiveLinks(url);
        if (links.length > 0) {
          modalLinks.value = links;
          showModal.value = true;
          nextTick(() => {
            initializeFocusableElements();
          });
        }
      },
      openLink: (url) => {
        window.location.href = url;
      }
    };
  }
});

app.mount('#app');
