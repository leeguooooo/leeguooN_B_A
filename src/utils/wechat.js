// 微信分享配置
export function setupWechatShare() {
  // 检测是否在微信内
  const isWechat = /MicroMessenger/i.test(navigator.userAgent)
  
  if (!isWechat) return
  
  // 动态设置分享信息
  const shareConfig = {
    title: '体育直播 - NBA/CBA/足球高清直播',
    desc: '免费观看体育赛事高清直播，支持手机、电脑观看，流畅不卡顿',
    link: window.location.href,
    imgUrl: window.location.origin + '/share-image.png'
  }
  
  // 微信 JS-SDK 配置（需要后端支持）
  // 这里只是示例，实际使用需要后端签名
  if (window.wx) {
    // wx.config({...})
    // wx.ready(() => {
    //   wx.updateAppMessageShareData(shareConfig)
    //   wx.updateTimelineShareData(shareConfig)
    // })
  }
  
  // 添加微信浏览器样式类
  document.documentElement.classList.add('wechat-browser')
}

// 获取当前页面的分享信息
export function getShareInfo(game = null) {
  if (game) {
    return {
      title: `${game.team1} vs ${game.team2} - 体育直播`,
      desc: `正在直播：${game.league} ${game.team1} vs ${game.team2}`,
      link: window.location.href,
      imgUrl: window.location.origin + '/share-image.png'
    }
  }
  
  return {
    title: '体育直播 - NBA/CBA/足球高清直播',
    desc: '免费观看体育赛事高清直播，流畅不卡顿',
    link: window.location.href,
    imgUrl: window.location.origin + '/share-image.png'
  }
}