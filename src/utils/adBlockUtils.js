/**
 * 去广告工具函数
 * 提供全面的广告拦截功能
 */

/**
 * 生成去广告脚本代码
 * @returns {string} 可执行的JavaScript代码字符串
 */
export function generateAdBlockCode() {
  return `
    (function() {
      // 防止重复执行
      if (window.__tabHiveAdBlockInjected) {
        console.log('[Tab Hive AdBlock] 已经注入过，跳过');
        return { success: true, message: '已注入' };
      }
      window.__tabHiveAdBlockInjected = true;
      
      console.log('[Tab Hive AdBlock] ========== 开始去广告 ==========');
      
      try {
        const styleId = 'tabhive-adblock-style';
        
        // 移除旧样式
        const oldStyle = document.getElementById(styleId);
        if (oldStyle) {
          oldStyle.remove();
        }
        
        // 常见的广告相关选择器（基于 uBlock Origin 和 AdBlock Plus 的规则）
        const adSelectors = [
          // 通用广告标识
          '[id*="ad"]',
          '[id*="advertisement"]',
          '[id*="banner"]',
          '[id*="promo"]',
          '[class*="ad"]',
          '[class*="advertisement"]',
          '[class*="banner"]',
          '[class*="promo"]',
          '[class*="sponsor"]',
          '[class*="adsense"]',
          '[data-ad]',
          '[data-ad-slot]',
          '[data-adid]',
          '[data-ad-client]',
          '[data-adformat]',
          '[data-adsbygoogle]',
          
          // 常见的广告容器类名
          '.advertisement',
          '.ad-banner',
          '.ad-container',
          '.ad-wrapper',
          '.ads-wrapper',
          '.ads-container',
          '.advertisement-container',
          '.google-ad',
          '.google-ads',
          '.adsbygoogle',
          '.ad-sense',
          '.sponsored',
          '.sponsor',
          '.promo-banner',
          '.promotion',
          
          // iframe 广告
          'iframe[src*="doubleclick"]',
          'iframe[src*="googlesyndication"]',
          'iframe[src*="googleadservices"]',
          'iframe[src*="advertising"]',
          'iframe[id*="ad"]',
          'iframe[class*="ad"]',
          'iframe[data-ad]',
          
          // 特定网站的广告选择器
          '#google_ads',
          '#google_ads_iframe',
          '.ad-top',
          '.ad-bottom',
          '.ad-left',
          '.ad-right',
          '.ad-sidebar',
          '.ad-header',
          '.ad-footer',
          '.ad-content',
          '.ad-text',
          '.ad-image',
          '.ad-link',
          
          // 隐藏的广告元素（通常用于统计）
          '[style*="display: none"][class*="ad"]',
          '[style*="position: absolute"][class*="ad"]',
          '[style*="visibility: hidden"][class*="ad"]',
          
          // 社交媒体广告
          '[data-testid*="ad"]',
          '[data-testid*="sponsored"]',
          '.sponsored-post',
          '.sponsored-content',
          '.promoted-post',
          '.promoted-content',
          
          // 视频广告容器
          '.video-ad',
          '.preroll-ad',
          '.midroll-ad',
          '.postroll-ad',
          '.ad-break',
          
          // 弹窗广告
          '.popup-ad',
          '.overlay-ad',
          '.modal-ad',
          '.lightbox-ad',
          '.ad-popup',
          
          // 固定位置广告
          '.sticky-ad',
          '.fixed-ad',
          '.floating-ad'
        ];
        
        // 广告相关的域名模式
        const adDomains = [
          'doubleclick.net',
          'googlesyndication.com',
          'googleadservices.com',
          'google-analytics.com',
          'googleadapis.com',
          'advertising.com',
          'adnxs.com',
          'adform.net',
          'adsafeprotected.com',
          'adsrvr.org',
          'adtechus.com',
          'amazon-adsystem.com',
          'criteo.com',
          'facebook.net',
          'facebook.com/tr',
          'media.net',
          'outbrain.com',
          'pubmatic.com',
          'rubiconproject.com',
          'scorecardresearch.com',
          'serving-sys.com',
          'turn.com'
        ];
        
        // 创建样式表隐藏广告
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = adSelectors.join(',\\n          ') + ' {\\n' +
          '          display: none !important;\\n' +
          '          visibility: hidden !important;\\n' +
          '          opacity: 0 !important;\\n' +
          '          height: 0 !important;\\n' +
          '          width: 0 !important;\\n' +
          '          overflow: hidden !important;\\n' +
          '          position: absolute !important;\\n' +
          '          left: -9999px !important;\\n' +
          '        }\\n' +
          '        \\n' +
          '        /* 隐藏广告容器 */\\n' +
          '        [id*="ad"][style*="position: fixed"],\\n' +
          '        [id*="ad"][style*="position: sticky"],\\n' +
          '        [class*="ad"][style*="position: fixed"],\\n' +
          '        [class*="ad"][style*="position: sticky"] {\\n' +
          '          display: none !important;\\n' +
          '        }';
        
        document.head.appendChild(style);
        console.log('[Tab Hive AdBlock] ✓ CSS 样式已注入');
        
        // 拦截广告请求（通过 MutationObserver 动态移除新加载的广告）
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === 1) { // Element node
                // 检查是否是广告元素
                const isAd = adSelectors.some(selector => {
                  try {
                    return node.matches && node.matches(selector);
                  } catch (e) {
                    return false;
                  }
                }) || 
                (node.id && /ad|advertisement|banner|promo|sponsor/i.test(node.id)) ||
                (node.className && typeof node.className === 'string' && /ad|advertisement|banner|promo|sponsor|adsense/i.test(node.className)) ||
                (node.getAttribute && (
                  node.getAttribute('data-ad') ||
                  node.getAttribute('data-ad-slot') ||
                  node.getAttribute('data-ad-client') ||
                  node.getAttribute('data-adid')
                ));
                
                if (isAd) {
                  console.log('[Tab Hive AdBlock] 检测到广告元素，已移除:', node);
                  node.style.display = 'none';
                  node.remove();
                  return;
                }
                
                // 检查 iframe 的 src
                if (node.tagName === 'IFRAME' && node.src) {
                  const isAdIframe = adDomains.some(domain => node.src.includes(domain)) ||
                                   /doubleclick|googlesyndication|googleadservices|advertising/i.test(node.src) ||
                                   /ad|banner|promo/i.test(node.src);
                  
                  if (isAdIframe) {
                    console.log('[Tab Hive AdBlock] 检测到广告 iframe，已移除:', node.src);
                    node.remove();
                    return;
                  }
                }
                
                // 递归检查子元素
                if (node.querySelectorAll) {
                  try {
                    adSelectors.forEach(selector => {
                      const adElements = node.querySelectorAll(selector);
                      adElements.forEach(el => {
                        console.log('[Tab Hive AdBlock] 检测到子元素中的广告，已移除');
                        el.style.display = 'none';
                        el.remove();
                      });
                    });
                  } catch (e) {
                    // 忽略选择器错误
                  }
                }
              }
            });
          });
        });
        
        // 开始观察
        observer.observe(document.body, {
          childList: true,
          subtree: true
        });
        
        console.log('[Tab Hive AdBlock] ✓ MutationObserver 已启动');
        
        // 拦截资源请求（通过重写 fetch 和 XMLHttpRequest）
        const originalFetch = window.fetch;
        window.fetch = function(...args) {
          const url = args[0];
          if (typeof url === 'string') {
            const isAdRequest = adDomains.some(domain => url.includes(domain)) ||
                              /doubleclick|googlesyndication|googleadservices|advertising|adsbygoogle/i.test(url);
            
            if (isAdRequest) {
              console.log('[Tab Hive AdBlock] 拦截广告请求:', url);
              return Promise.reject(new Error('Blocked by Tab Hive AdBlock'));
            }
          }
          return originalFetch.apply(this, args);
        };
        
        const originalXHROpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function(method, url, ...args) {
          if (typeof url === 'string') {
            const isAdRequest = adDomains.some(domain => url.includes(domain)) ||
                              /doubleclick|googlesyndication|googleadservices|advertising|adsbygoogle/i.test(url);
            
            if (isAdRequest) {
              console.log('[Tab Hive AdBlock] 拦截 XHR 广告请求:', url);
              return;
            }
          }
          return originalXHROpen.apply(this, [method, url, ...args]);
        };
        
        console.log('[Tab Hive AdBlock] ✓ 请求拦截已设置');
        
        // 移除页面加载时的广告
        const removeExistingAds = () => {
          let removedCount = 0;
          
          adSelectors.forEach(selector => {
            try {
              const elements = document.querySelectorAll(selector);
              elements.forEach(el => {
                el.style.display = 'none';
                el.remove();
                removedCount++;
              });
            } catch (e) {
              // 忽略选择器错误
            }
          });
          
          // 移除广告 iframe
          document.querySelectorAll('iframe').forEach(iframe => {
            if (iframe.src) {
              const isAdIframe = adDomains.some(domain => iframe.src.includes(domain)) ||
                               /doubleclick|googlesyndication|googleadservices|advertising/i.test(iframe.src) ||
                               /ad|banner|promo/i.test(iframe.src);
              
              if (isAdIframe) {
                iframe.remove();
                removedCount++;
              }
            }
          });
          
          console.log('[Tab Hive AdBlock] ✓ 已移除', removedCount, '个现有广告元素');
        };
        
        // 立即执行一次
        removeExistingAds();
        
        // DOMContentLoaded 时再执行一次
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', removeExistingAds);
        } else {
          removeExistingAds();
        }
        
        // 页面完全加载后再执行一次（处理动态加载的广告）
        window.addEventListener('load', () => {
          setTimeout(removeExistingAds, 1000);
        });
        
        console.log('[Tab Hive AdBlock] ========== 去广告功能已启用 ==========');
        
        return {
          success: true,
          message: '去广告功能已启用',
          removedAds: 0 // 将在后续更新中统计
        };
      } catch (e) {
        console.error('[Tab Hive AdBlock] 错误:', e);
        return { success: false, error: e.message };
      }
    })();
  `;
}

/**
 * 生成移除去广告的代码
 * @returns {string} 可执行的JavaScript代码字符串
 */
export function generateRemoveAdBlockCode() {
  return `
    (function() {
      console.log('[Tab Hive AdBlock] ========== 移除去广告功能 ==========');
      
      try {
        // 移除样式
        const style = document.getElementById('tabhive-adblock-style');
        if (style) {
          style.remove();
          console.log('[Tab Hive AdBlock] ✓ 样式已移除');
        }
        
        // 清除标记
        window.__tabHiveAdBlockInjected = false;
        
        console.log('[Tab Hive AdBlock] ✓ 去广告功能已移除');
        return { success: true };
      } catch (e) {
        console.error('[Tab Hive AdBlock] 移除错误:', e);
        return { success: false, error: e.message };
      }
    })();
  `;
}

