<template>
  <div class="landing-page">
    <!-- Navbar -->
    <nav class="navbar" :class="{ 'scrolled': isScrolled }">
      <div class="nav-container">
        <div class="nav-logo">
          <img src="/256x256.png" alt="Tab Hive" class="logo-img" />
          <span class="logo-text">Tab Hive</span>
        </div>
        <div class="nav-links">
          <a href="#features">功能</a>
          <a href="#download" class="nav-download-btn">下载客户端</a>
        </div>
      </div>
    </nav>

    <!-- Hero Section -->
    <section class="hero">
      <div class="hero-content">
        <div class="hero-text">
          <h1 class="title">将网页铺满<br>你的无限画布</h1>
          <p class="subtitle">Tab Hive 将浏览器变成一张可无限扩展的画布。自由平铺、组合多个网页，打造属于你的专属工作台。不再受限于单一标签页，让信息触手可及。</p>
          
          <div class="hero-buttons">
            <a href="#download" class="primary-btn">
              <span>立即下载</span>
              <svg class="btn-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
              </svg>
            </a>
            <a href="https://github.com/MaskerPRC/tab-hive" target="_blank" class="secondary-btn">
              <span>GitHub</span>
              <svg class="btn-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </a>
          </div>
          
          <div class="version-badge" v-if="version">
            最新版本: v{{ version }}
          </div>
        </div>
        
        <div class="hero-visual">
          <!-- 这里可以使用应用截图或者抽象的蜂巢图形 -->
          <div class="app-window-mockup">
            <div class="window-header">
              <div class="window-controls">
                <span class="control close"></span>
                <span class="control minimize"></span>
                <span class="control maximize"></span>
              </div>
              <div class="address-bar"></div>
            </div>
            <div class="window-content">
              <div class="grid-layout">
                 <div class="grid-item">
                   <div class="website-preview baidu">
                     <div class="site-logo">
                       <svg viewBox="0 0 24 24" fill="none">
                         <!-- 百度熊掌图标 - 白色填充 -->
                         <path d="M9 8c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2z" fill="white"/>
                         <path d="M19 8c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2z" fill="white"/>
                         <path d="M12 14c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2z" fill="white"/>
                         <path d="M7 16c0 .8-.6 1.4-1.4 1.4S4.2 16.8 4.2 16s.6-1.4 1.4-1.4S7 15.2 7 16z" fill="white"/>
                         <path d="M19.8 16c0 .8-.6 1.4-1.4 1.4s-1.4-.6-1.4-1.4.6-1.4 1.4-1.4 1.4 .6 1.4 1.4z" fill="white"/>
                       </svg>
                     </div>
                     <div class="site-name">百度</div>
                   </div>
                 </div>
                <div class="grid-item">
                  <div class="website-preview google">
                    <div class="site-logo">
                      <svg viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                    </div>
                    <div class="site-name">Google</div>
                  </div>
                </div>
                <div class="grid-item">
                  <div class="website-preview apple">
                    <div class="site-logo">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.08-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                      </svg>
                    </div>
                    <div class="site-name">Apple</div>
                  </div>
                </div>
                <div class="grid-item">
                  <div class="website-preview github">
                    <div class="site-logo">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                      </svg>
                    </div>
                    <div class="site-name">GitHub</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section id="features" class="features">
      <div class="container">
        <h2 class="section-title">核心功能</h2>
        <p class="section-subtitle">不仅仅是一个浏览器，更是你的生产力工具箱</p>
        
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon-wrapper">
              <span class="feature-icon">📑</span>
            </div>
            <h3>多窗口分屏</h3>
            <p>支持 2x2、3x3 等多种网格布局，同时浏览多个网页，提高信息获取效率。</p>
          </div>
          
          <div class="feature-card">
            <div class="feature-icon-wrapper">
              <span class="feature-icon">🗂️</span>
            </div>
            <h3>工作区管理</h3>
            <p>创建多个工作区布局，一键切换不同场景，让工作与娱乐互不干扰。</p>
          </div>
          
          <div class="feature-card">
            <div class="feature-icon-wrapper">
              <span class="feature-icon">🔒</span>
            </div>
            <h3>会话隔离</h3>
            <p>每个标签页可拥有独立的 Cookie 和 Session，轻松管理多个账号。</p>
          </div>
          
          <div class="feature-card">
            <div class="feature-icon-wrapper">
              <span class="feature-icon">🌐</span>
            </div>
            <h3>网络代理</h3>
            <p>内置代理管理器，支持为不同环境配置专属网络连接。</p>
          </div>
          
          <div class="feature-card">
            <div class="feature-icon-wrapper">
              <span class="feature-icon">🛡️</span>
            </div>
            <h3>隐私保护</h3>
            <p>内置广告拦截和隐私防护功能，还原本真的浏览体验。</p>
          </div>
          
          <div class="feature-card">
            <div class="feature-icon-wrapper">
              <span class="feature-icon">⚡</span>
            </div>
            <h3>自定义脚本</h3>
            <p>支持注入自定义 JavaScript 和 CSS，随心所欲定制网页行为。</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Download Section -->
    <section id="download" class="download-section">
      <div class="container">
        <div class="download-card">
          <div class="download-content">
            <h2 class="download-title">开始使用 Tab Hive</h2>
            <p class="download-desc">选择适合你系统的版本，开启高效浏览体验。</p>
            
            <div class="download-buttons-large">
              <button 
                v-if="downloadLinks.windows" 
                @click="download('windows')"
                class="download-btn-lg windows-btn"
                :disabled="loading"
              >
                <div class="btn-content">
                  <span class="os-name">Windows</span>
                  <span class="os-desc">适用于 Windows 10/11</span>
                </div>
                <div class="btn-icon">⬇️</div>
              </button>
              
              <button 
                v-if="downloadLinks.mac" 
                @click="download('mac')"
                class="download-btn-lg mac-btn"
                :disabled="loading"
              >
                <div class="btn-content">
                  <span class="os-name">macOS</span>
                  <span class="os-desc">支持 Intel 和 Apple Silicon</span>
                </div>
                <div class="btn-icon">⬇️</div>
              </button>
            </div>
            
            <div v-if="loading" class="loading-state">
              <div class="spinner"></div>
              <span>正在获取最新版本...</span>
            </div>
            
            <div v-if="error" class="error-message">
              {{ error }} <button @click="fetchDownloadLinks" class="retry-btn">重试</button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <div class="container">
        <div class="footer-content">
          <div class="footer-brand">
            <span class="logo-text">Tab Hive</span>
            <p class="copyright">© {{ new Date().getFullYear() }} Tab Hive. Open Source Project.</p>
          </div>
          <div class="footer-links">
            <a href="https://github.com/MaskerPRC/tab-hive" target="_blank">GitHub</a>
            <a href="https://github.com/MaskerPRC/tab-hive/issues" target="_blank">反馈问题</a>
            <a href="https://github.com/MaskerPRC/tab-hive/blob/master/LICENSE" target="_blank">开源协议</a>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'

const GITHUB_REPO = 'MaskerPRC/tab-hive'
const GITHUB_API = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`

export default {
  name: 'LandingPage',
  setup() {
    const loading = ref(true)
    const error = ref(null)
    const version = ref('')
    const isScrolled = ref(false)
    const downloadLinks = ref({
      windows: null,
      mac: null
    })

    const handleScroll = () => {
      isScrolled.value = window.scrollY > 50
    }

    const fetchDownloadLinks = async () => {
      try {
        loading.value = true
        error.value = null

        const response = await fetch(GITHUB_API)
        if (!response.ok) {
          throw new Error('无法获取发布信息')
        }

        const data = await response.json()
        version.value = data.tag_name.replace('v', '')

        // 查找 Windows 和 Mac 的下载链接
        const windowsAsset = data.assets.find(asset => 
          asset.name.includes('.exe') && !asset.name.includes('.blockmap')
        )
        const macAsset = data.assets.find(asset => 
          asset.name.includes('.dmg') && !asset.name.includes('.blockmap')
        )

        if (windowsAsset) {
          downloadLinks.value.windows = windowsAsset.browser_download_url
        }
        if (macAsset) {
          downloadLinks.value.mac = macAsset.browser_download_url
        }

        if (!windowsAsset && !macAsset) {
          error.value = '暂无可用的下载文件'
        }
      } catch (err) {
        console.error('获取下载链接失败:', err)
        error.value = '获取下载链接失败'
      } finally {
        loading.value = false
      }
    }

    const download = (platform) => {
      const url = downloadLinks.value[platform]
      if (url) {
        window.open(url, '_blank')
      }
    }

    onMounted(() => {
      fetchDownloadLinks()
      window.addEventListener('scroll', handleScroll)
    })

    onUnmounted(() => {
      window.removeEventListener('scroll', handleScroll)
    })

    return {
      loading,
      error,
      version,
      downloadLinks,
      download,
      fetchDownloadLinks,
      isScrolled
    }
  }
}
</script>
