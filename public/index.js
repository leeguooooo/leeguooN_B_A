const { createApp, ref, computed, watch, onMounted, onUnmounted, nextTick } =
  Vue;

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

    // 存储弹窗打开前的焦点元素
    const previousFocus = ref(null);

    const openLiveLink = async url => {
      debugger;
      try {
        const liveLinks = await fetchLiveLinks(url);
        const targetLink = liveLinks.find(link =>
          link.name.includes('中文高清 Q')
        );

        if (targetLink) {
          window.location.href = targetLink.url;
        } else if (liveLinks.length > 0) {
          // 保存当前焦点元素
          previousFocus.value = document.activeElement;
          modalLinks.value = liveLinks;
          showModal.value = true;
          nextTick(() => {
            // 重新初始化可聚焦元素并聚焦到第一个按钮
            initializeFocusableElements();
            const modalButtons = document.querySelectorAll('.modal button');
            if (modalButtons.length > 0) {
              modalButtons[0].focus();
              currentFocus.value = focusableElements.value.indexOf(
                modalButtons[0]
              );
            }
          });
        } else {
          console.error('No live links found');
        }
      } catch (error) {
        console.error('Error opening live link:', error);
      }
    };

    const openLink = async url => {
      try {
        // 直接打开播放器页面，让播放器处理流地址和代理
        window.open(`/player.html?url=${encodeURIComponent(url)}`, '_blank');
        showModal.value = false;
      } catch (error) {
        console.error('打开播放器错误:', error.message);
      }
    };

    // TV Navigation System
    const currentFocus = ref(null);
    const focusableElements = ref([]);

    const initializeFocusableElements = () => {
      focusableElements.value = Array.from(
        document.querySelectorAll('.focusable')
      );
      if (focusableElements.value.length > 0) {
        focusableElements.value[0].focus();
        currentFocus.value = 0;
      }
    };

    const handleKeyNavigation = event => {
      if (!focusableElements.value.length) return;

      const currentElement = focusableElements.value[currentFocus.value];
      let nextIndex = currentFocus.value;

      // 处理 Apple TV 遥控器和键盘事件
      switch (event.key || event.keyIdentifier) {
        case 'ArrowUp':
        case 'Up':
          event.preventDefault();
          if (showModal.value) {
            // 在弹窗内向上导航
            const modalButtons = Array.from(
              document.querySelectorAll('.modal button')
            );
            const currentModalIndex = modalButtons.indexOf(currentElement);
            if (currentModalIndex > 0) {
              nextIndex = focusableElements.value.indexOf(
                modalButtons[currentModalIndex - 1]
              );
            }
          } else {
            nextIndex = Math.max(0, currentFocus.value - 1);
          }
          break;
        case 'ArrowDown':
        case 'Down':
          event.preventDefault();
          if (showModal.value) {
            // 在弹窗内向下导航
            const modalButtons = Array.from(
              document.querySelectorAll('.modal button')
            );
            const currentModalIndex = modalButtons.indexOf(currentElement);
            if (currentModalIndex < modalButtons.length - 1) {
              nextIndex = focusableElements.value.indexOf(
                modalButtons[currentModalIndex + 1]
              );
            }
          } else {
            nextIndex = Math.min(
              focusableElements.value.length - 1,
              currentFocus.value + 1
            );
          }
          break;
        case 'Enter':
        case 'Select': // Apple TV 遥控器确认键
          event.preventDefault();
          currentElement.click();
          break;
        case 'Escape':
        case 'Menu': // Apple TV 遥控器菜单键
          if (showModal.value) {
            showModal.value = false;
            // 恢复之前的焦点
            nextTick(() => {
              if (previousFocus.value) {
                previousFocus.value.focus();
                currentFocus.value = focusableElements.value.indexOf(
                  previousFocus.value
                );
              }
            });
          }
          break;
      }

      if (nextIndex !== currentFocus.value) {
        currentFocus.value = nextIndex;
        focusableElements.value[nextIndex].focus();
      }
    };

    // 监听 keydown 和 Apple TV 遥控器事件
    const setupEventListeners = () => {
      window.addEventListener('keydown', handleKeyNavigation);

      // Apple TV 遥控器事件
      window.addEventListener('select', e => {
        e.preventDefault();
        const currentElement = focusableElements.value[currentFocus.value];
        if (currentElement) {
          currentElement.click();
        }
      });
    };

    // Watch for changes in the DOM that might affect focusable elements
    watch([games, showModal, filteredGames], () => {
      nextTick(() => {
        initializeFocusableElements();
        // 确保焦点在有效的可见元素上
        if (currentFocus.value !== null && focusableElements.value.length > 0) {
          currentFocus.value = Math.min(
            currentFocus.value,
            focusableElements.value.length - 1
          );
          focusableElements.value[currentFocus.value].focus();
        }
      });
    });

    // Mount keyboard navigation
    onMounted(() => {
      setupEventListeners();
      initializeFocusableElements();

      // 自动聚焦到第一个元素
      nextTick(() => {
        if (focusableElements.value.length > 0) {
          focusableElements.value[0].focus();
        }
      });
    });

    onUnmounted(() => {
      window.removeEventListener('keydown', handleKeyNavigation);
      window.removeEventListener('select', handleKeyNavigation);
    });

    return {
      games,
      isLoading,
      showModal,
      modalLinks,
      selectedLeagues,
      leagues,
      groupedGames,
      openLiveLink: async url => {
        const links = await fetchLiveLinks(url);
        if (links.length > 0) {
          modalLinks.value = links;
          showModal.value = true;
          nextTick(() => {
            initializeFocusableElements();
          });
        }
      },
      openLink: async url => {
        try {
          // 直接打开播放器页面，让播放器处理流地址和代理
          window.open(`/player.html?url=${encodeURIComponent(url)}`, '_blank');
          showModal.value = false;
        } catch (error) {
          console.error('打开播放器错误:', error.message);
        }
      },
    };
  },
});

app.mount('#app');
