<template>
  <div class="apm-container">
    <div class="nav-header">
      <div class="nav-menu">
        <div class="logo" @click="showAboutDialog = true">
          <span class="logo-text">Live<span class="logo-highlight">In</span></span>
          <span class="logo-subtitle">RAG管理台</span>
        </div>
        <div class="nav-divider"></div>
        <div 
          v-for="item in menuItems" 
          :key="item.name"
          :class="['nav-item', { active: activeTab === item.name }]"
          @click="handleClick(item)"
        >
          {{ item.label }}
        </div>
      </div>
    </div>
    
    <!-- 关于我们弹窗 -->
    <el-dialog
      v-model="showAboutDialog"
      title="关于我们"
      width="400px"
      custom-class="about-dialog"
      :show-close="true"
      :close-on-click-modal="true"
      :close-on-press-escape="true"
    >
      <div class="about-content">
        <div class="about-logo">
          <span class="about-logo-text">Live<span class="about-logo-highlight">In</span></span>
        </div>
        <div class="about-description">
          如有新的想法或需求，请联系：
          <div class="about-email">
            <a href="mailto:sunxiaoteng001@ke.com">sunxiaoteng001@ke.com</a>
          </div>
        </div>
      </div>
    </el-dialog>
    
    <div class="content-area">
      <TraceQuery v-if="activeTab === 'trace'" />
      <LlmAgg v-if="activeTab === 'llm'" />
    </div>
  </div>
</template>

<script>
import TraceQuery from './TraceQuery.vue'
import LlmAgg from './LlmAgg.vue'

export default {
  name: 'ApmMain',
  components: {
    TraceQuery,
    LlmAgg
  },
  data() {
    return {
      activeTab: 'trace',
      menuItems: [
        { name: 'trace', label: '链路查询' },
        { name: 'llm', label: '模型调用统计' }
      ],
      showAboutDialog: false
    }
  },
  methods: {
    handleClick(item) {
      this.activeTab = item.name
      console.log('切换到:', item.name)
    }
  }
}
</script>

<style scoped>
.apm-container {
  height: 100%;
  background: #f6f8fa;
}

.nav-header {
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  padding: 0 24px;
  position: relative;
  z-index: 1;
}

.nav-menu {
  height: 56px;
  display: flex;
  align-items: center;
  max-width: 1400px;
  margin: 0 auto;
  position: relative;
}

.nav-item {
  padding: 0 24px;
  font-size: 15px;
  color: #606266;
  cursor: pointer;
  height: 56px;
  line-height: 56px;
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
  margin-top: 2px;
}

.nav-item:hover {
  color: #1a73e8;
  background: rgba(26, 115, 232, 0.04);
}

.nav-item::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 0;
  height: 2px;
  background: #1a73e8;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0;
  transform: translateX(-50%);
}

.nav-item:hover::before {
  width: 24px;
  opacity: 0.6;
}

.nav-item.active {
  color: #1a73e8;
  font-weight: 500;
}

.nav-item.active::before {
  width: 100%;
  opacity: 1;
}

/* 添加点击效果 */
.nav-item:active {
  transform: scale(0.98);
}

/* 确保过渡效果平滑 */
.nav-item {
  transform-origin: center;
  backface-visibility: hidden;
  -webkit-font-smoothing: antialiased;
}

.content-area {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
  min-height: calc(100vh - 56px);
  box-sizing: border-box;
  width: 100%;
}

@media screen and (min-width: 1920px) {
  .nav-menu,
  .content-area {
    max-width: 1600px;
  }
}

@media screen and (max-width: 1400px) {
  .content-area {
    padding: 24px 16px;
  }
}

.logo {
  font-size: 22px;
  font-weight: 600;
  color: #2c3e50;
  padding: 0 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  user-select: none;
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-text {
  letter-spacing: -0.5px;
}

.logo-subtitle {
  font-size: 15px;
  color: #606266;
  font-weight: 500;
}

.logo:hover {
  transform: scale(1.02);
}

.logo-highlight {
  color: #1a73e8;
  font-weight: 700;
}

.nav-divider {
  width: 1px;
  height: 24px;
  background: #e0e0e0;
  margin: 0 16px;
}

/* 关于我们弹窗样式 */
:deep(.about-dialog) {
  border-radius: 12px;
  overflow: hidden;
}

:deep(.about-dialog .el-dialog__header) {
  padding: 20px 24px;
  margin: 0;
  border-bottom: 1px solid #f0f0f0;
}

:deep(.about-dialog .el-dialog__title) {
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
}

:deep(.about-dialog .el-dialog__body) {
  padding: 32px 24px;
}

.about-content {
  text-align: center;
}

.about-logo {
  margin-bottom: 24px;
}

.about-logo-text {
  font-size: 28px;
  font-weight: 600;
  letter-spacing: -0.5px;
}

.about-logo-highlight {
  color: #1a73e8;
  font-weight: 700;
}

.about-description {
  color: #606266;
  font-size: 15px;
  line-height: 1.6;
}

.about-email {
  margin-top: 12px;
}

.about-email a {
  color: #1a73e8;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s ease;
}

.about-email a:hover {
  color: #1557b0;
  text-decoration: underline;
}

/* 优化弹窗动画 */
:deep(.el-dialog) {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

:deep(.el-overlay) {
  transition: opacity 0.3s ease;
}
</style> 