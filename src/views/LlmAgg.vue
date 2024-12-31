<template>
  <div class="llm-agg">
    <div class="page-header">
      <div class="header-content">
        <div class="title-wrapper">
          <div class="icon-wrapper">
            <el-icon><DataAnalysis /></el-icon>
          </div>
          <span class="title">LLM 聚合</span>
        </div>
        <div class="header-desc">查看各个 LLM 模型的调用情况统计</div>
      </div>
    </div>

    <el-card class="query-card">
      <div class="filter-container">
        <div class="filter-item">
          <span class="label">日期：</span>
          <el-date-picker
            v-model="selectedDate"
            type="date"
            placeholder="选择日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            class="filter-input">
          </el-date-picker>
        </div>
        <div class="filter-item">
          <el-button type="primary" @click="fetchData" :loading="loading">查询</el-button>
        </div>
      </div>
    </el-card>

    <el-card class="data-card" v-if="aggregateData">
      <div class="chart-container">
        <div v-if="hasData" ref="pieChart" class="pie-chart"></div>
        <el-empty v-else description="暂无数据" />
      </div>
      
      <div v-for="(prompts, model) in aggregateData" 
           :key="model" 
           class="model-group"
           :class="{'highlight-model': isTopModel(model)}">
        <div class="model-title">模型：{{ model }}</div>
        <el-table 
          :data="formatPromptData(prompts)" 
          border 
          stripe
          style="width: 100%">
          <el-table-column prop="prompt" label="Prompt" min-width="300"></el-table-column>
          <el-table-column prop="count" label="调用次数" width="120" align="center"></el-table-column>
        </el-table>
      </div>
    </el-card>
  </div>
</template>

<script>
import axios from 'axios'
import * as echarts from 'echarts'
import { DataAnalysis } from '@element-plus/icons-vue'

export default {
  name: 'LlmAgg',
  components: {
    DataAnalysis
  },
  data() {
    return {
      selectedDate: this.getYesterday(),
      aggregateData: null,
      loading: false,
      pieChart: null,
      topModel: null
    }
  },
  computed: {
    hasData() {
      if (!this.aggregateData) return false
      return Object.keys(this.aggregateData).length > 0
    }
  },
  methods: {
    getYesterday() {
      const date = new Date()
      date.setDate(date.getDate() - 1)
      return date.toISOString().split('T')[0]
    },
    async fetchData() {
      if (!this.selectedDate) {
        this.$message.warning('请选择日期')
        return
      }

      this.loading = true
      try {
        const response = await axios.get(`/api/tracer/llm_call_agg`, {
          params: {
            time: this.selectedDate
          }
        })
        this.aggregateData = response.data.data
        this.$nextTick(() => {
          this.initPieChart()
        })
      } catch (error) {
        this.$message.error('获取数据失败：' + error.message)
      } finally {
        this.loading = false
      }
    },
    formatPromptData(prompts) {
      return Object.entries(prompts).map(([prompt, count]) => ({
        prompt,
        count
      }))
    },
    calculateModelStats() {
      const modelStats = {}
      if (!this.aggregateData) return []
      
      Object.entries(this.aggregateData).forEach(([model, prompts]) => {
        modelStats[model] = Object.values(prompts).reduce((sum, count) => sum + count, 0)
      })
      
      this.topModel = Object.entries(modelStats)
        .sort(([,a], [,b]) => b - a)[0]?.[0]
        
      return Object.entries(modelStats).map(([name, value]) => ({
        name,
        value,
        itemStyle: {
          color: name === this.topModel ? '#409EFF' : undefined
        }
      }))
    },
    
    initPieChart() {
      if (!this.hasData) return
      
      const chartDom = this.$refs.pieChart
      this.pieChart = echarts.init(chartDom)
      
      const option = {
        title: {
          text: '模型调用分布',
          left: 'center'
        },
        tooltip: {
          trigger: 'item',
          formatter: '{b}: {c} 次 ({d}%)'
        },
        legend: {
          orient: 'vertical',
          left: 'left'
        },
        series: [
          {
            type: 'pie',
            radius: '50%',
            data: this.calculateModelStats(),
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            }
          }
        ]
      }
      
      this.pieChart.setOption(option)
    },
    
    isTopModel(model) {
      return model === this.topModel
    }
  },
  mounted() {
    window.addEventListener('resize', () => {
      this.pieChart?.resize()
    })
  },
  beforeUnmount() {
    window.removeEventListener('resize', () => {
      this.pieChart?.resize()
    })
    this.pieChart?.dispose()
  },
  created() {
    this.fetchData()
  }
}
</script>

<style scoped>
.llm-agg {
  padding: 20px;
  background-color: #f0f2f5;
  min-height: calc(100vh - 84px);
}

.page-header {
  background: linear-gradient(135deg, #409EFF 0%, #85c5ff 100%);
  padding: 24px;
  margin-bottom: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 21, 41, 0.08);
  position: relative;
  overflow: hidden;
}

.page-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0) 100%);
  pointer-events: none;
}

.header-content {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.title-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.icon-wrapper {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
}

.title-wrapper .el-icon {
  font-size: 24px;
  color: white;
}

.title {
  font-size: 24px;
  font-weight: 600;
  color: white;
  line-height: 32px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-desc {
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  max-width: 600px;
}

.query-card {
  margin-bottom: 20px;
}

.filter-container {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
}

.filter-item {
  display: flex;
  align-items: center;
}

.filter-item .label {
  margin-right: 8px;
  color: #606266;
}

.filter-input {
  width: 220px;
}

.data-card {
  margin-bottom: 20px;
}

.model-group {
  margin-bottom: 24px;
}

.model-group:last-child {
  margin-bottom: 0;
}

.model-title {
  font-size: 16px;
  font-weight: 500;
  color: #1f2f3d;
  margin-bottom: 16px;
}

:deep(.el-table) {
  margin-top: 8px;
}

:deep(.el-card__body) {
  padding: 20px;
}

.chart-container {
  margin-bottom: 24px;
  min-height: 200px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.pie-chart {
  height: 400px;
  width: 100%;
}

.highlight-model {
  background-color: #ecf5ff;
  padding: 16px;
  border-radius: 4px;
}

.highlight-model .model-title {
  color: #409EFF;
}
</style> 