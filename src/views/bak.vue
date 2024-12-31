<template>
  <div class="trace-query">
    <el-card class="query-card dark-theme" v-loading="isLoading" element-loading-text="查询中...">
      <template #header>
        <div class="card-header">
          <span class="title">
            <el-icon @click="handleIconClick"><el-view /></el-icon>
            LiveIn RAG 链路追踪
          </span>
        </div>
      </template>
      
      <!-- 添加二级菜单 -->
      <div class="sub-menu">
        <el-menu 
          mode="horizontal" 
          class="sub-menu-list"
          :default-active="activeTab"
          @select="handleTabChange"
        >
          <el-menu-item index="trace">
            <el-icon><el-connection /></el-icon>
            链路追踪
          </el-menu-item>
          <el-menu-item index="llm_agg">
            <el-icon><el-data-analysis /></el-icon>
            模型统计
          </el-menu-item>
        </el-menu>
      </div>

      <div v-if="activeTab === 'trace'">
        <el-form 
          :model="queryForm" 
          label-width="100px" 
          class="query-form"
          @submit.prevent="handleQuery"
        >
          <el-form-item label="Trace ID">
            <el-input 
              v-model="queryForm.traceId" 
              placeholder="请输入完整的 Trace ID 进行查询..."
              clearable
              class="dark-input"
              @keyup.enter="handleQuery"
            >
              <template #prepend>
                <el-icon><el-key /></el-icon>
              </template>
              <template #append>
                <el-button 
                  type="primary" 
                  @click="handleQuery"
                  :loading="isLoading"
                  class="search-btn"
                >
                  <el-icon><el-search /></el-icon>
                  {{ isLoading ? '查询中' : '查询' }}
                </el-button>
              </template>
            </el-input>
          </el-form-item>
        </el-form>

        <template v-if="ragInfo.query">
          <div class="rag-info-section">
            <div class="rag-info-header">RAG 信息</div>
            <div class="rag-info-content">
              <div class="rag-info-item">
                <div class="rag-info-label">环境</div>
                <div class="rag-info-value">{{ ragInfo.env }}</div>
              </div>
              <div class="rag-info-item">
                <div class="rag-info-label">Query</div>
                <div class="rag-info-value">{{ ragInfo.query }}</div>
              </div>
              <div class="rag-info-item">
                <div class="rag-info-label">Message ID</div>
                <div class="rag-info-value">{{ ragInfo.messageId }}</div>
              </div>
            </div>
          </div>
        </template>

        <el-tabs v-model="activeView" class="view-tabs" @tab-click="handleViewChange">
          <el-tab-pane name="timeline">
            <template #label>
              <el-icon><el-timer /></el-icon> 时序视图
            </template>
          </el-tab-pane>
          <el-tab-pane name="service-business">
            <template #label>
              <el-icon><el-office-building /></el-icon> 服务-业务类型视图
            </template>
          </el-tab-pane>
          <el-tab-pane name="service">
            <template #label>
              <el-icon><el-service /></el-icon> 服务视图
            </template>
          </el-tab-pane>
          <el-tab-pane name="service-node">
            <template #label>
              <el-icon><el-share /></el-icon> 服务-节点视图
            </template>
          </el-tab-pane>
        </el-tabs>

        <!-- 查询结果列表 -->
        <div class="query-results" v-if="traceNodes.length">
          <!-- 时序视图 -->
          <el-table 
            v-if="activeView === 'timeline'"
            :data="traceNodes" 
            stripe 
            style="width: 100%"
            class="dark-table"
          >
            <el-table-column 
              prop="node_key" 
              label="节点" 
              width="180"
              :filters="nodeKeyOptions"
              :filter-method="handleColumnFilter"
              filter-placement="bottom-start"
            >
              <template #default="{ row }">
                <div class="node-cell">
                  <el-icon><el-connection /></el-icon>
                  {{ row.node_key }}
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="__created_at" label="创建时间" width="180">
              <template #default="{ row }">
                <div class="time-cell">
                  <el-icon><el-timer /></el-icon>
                  {{ formatTime(row.__created_at) }}
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="endpoint" label="端点" width="180">
              <template #default="{ row }">
                <div class="endpoint-cell">
                  <el-icon><el-position /></el-icon>
                  {{ row.endpoint }}
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="time_cost" label="耗时(s)" width="120">
              <template #default="{ row }">
                <div class="time-cost-cell">
                  <el-icon><el-timer /></el-icon>
                  {{ Number(row.time_cost).toFixed(2) }}s
                </div>
              </template>
            </el-table-column>
            <el-table-column 
              prop="business_type" 
              label="业务类型" 
              width="150"
              :filters="businessTypeOptions"
              :filter-method="handleColumnFilter"
              filter-placement="bottom-start"
            >
              <template #default="{ row }">
                <div class="business-type-cell">
                  <el-icon><el-office-building /></el-icon>
                  {{ row.business_type }}
                </div>
              </template>
            </el-table-column>
            <el-table-column 
              prop="from_service" 
              label="来源服务" 
              width="150"
              :filters="fromServiceOptions"
              :filter-method="handleColumnFilter"
              filter-placement="bottom-start"
            >
              <template #default="{ row }">
                <div class="service-cell">
                  <el-icon><el-service /></el-icon>
                  {{ row.from_service }}
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="node_desc" label="节点描述" width="150">
              <template #default="{ row }">
                <div class="node-desc-cell">
                  <el-icon><el-info-filled /></el-icon>
                  {{ row.node_desc }}
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="node_name" label="节点名称" width="150">
              <template #default="{ row }">
                <div class="node-name-cell">
                  <el-icon><el-price-tag /></el-icon>
                  {{ row.node_name }}
                </div>
              </template>
            </el-table-column>
            <el-table-column label="事件数据" min-width="200">
              <template #default="{ row }">
                <el-button 
                  type="text" 
                  @click="showEventData(row.event_data)"
                  class="view-btn"
                >
                  <el-icon><el-document /></el-icon>
                  查看详情
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 服务视图 -->
          <div v-else-if="activeView === 'service'" class="service-view">
            <el-collapse v-model="activeGroups">
              <el-collapse-item 
                v-for="group in groupedServices" 
                :key="group.serviceName"
                :title="group.serviceName"
                :name="group.serviceName"
              >
                <template #title>
                  <div class="group-title">
                    <el-icon><el-service /></el-icon>
                    <span>{{ group.serviceName || '未知服务' }}</span>
                    <el-tag size="small" type="success">{{ group.nodes.length }}</el-tag>
                  </div>
                </template>
                
                <el-table 
                  :data="group.nodes" 
                  stripe 
                  style="width: 100%"
                  class="dark-table nested-table"
                >
                  <el-table-column prop="node_key" label="节点" width="180">
                    <template #default="{ row }">
                      <div class="node-cell">
                        <el-icon><el-connection /></el-icon>
                        {{ row.node_key }}
                      </div>
                    </template>
                  </el-table-column>
                  <el-table-column prop="node_name" label="节点名称" width="150">
                    <template #default="{ row }">
                      <div class="node-name-cell">
                        <el-icon><el-price-tag /></el-icon>
                        {{ row.node_name }}
                      </div>
                    </template>
                  </el-table-column>
                  <el-table-column prop="node_desc" label="节点描述" width="200">
                    <template #default="{ row }">
                      <div class="node-desc-cell">
                        <el-icon><el-info-filled /></el-icon>
                        {{ row.node_desc }}
                      </div>
                    </template>
                  </el-table-column>
                  <el-table-column prop="__created_at" label="创建时间" width="180">
                    <template #default="{ row }">
                      <div class="time-cell">
                        <el-icon><el-timer /></el-icon>
                        {{ formatTime(row.__created_at) }}
                      </div>
                    </template>
                  </el-table-column>
                  <el-table-column prop="endpoint" label="端点" width="180">
                    <template #default="{ row }">
                      <div class="endpoint-cell">
                        <el-icon><el-position /></el-icon>
                        {{ row.endpoint }}
                      </div>
                    </template>
                  </el-table-column>
                  <el-table-column prop="time_cost" label="耗时(ms)" width="120">
                    <template #default="{ row }">
                      <div class="time-cost-cell">
                        <el-icon><el-timer /></el-icon>
                        {{ row.time_cost }}
                      </div>
                    </template>
                  </el-table-column>
                  <el-table-column label="事件数据" min-width="200">
                    <template #default="{ row }">
                      <el-button 
                        type="text" 
                        @click="showEventData(row.event_data)"
                        class="view-btn"
                      >
                        <el-icon><el-document /></el-icon>
                        查看详情
                      </el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </el-collapse-item>
            </el-collapse>
          </div>

          <!-- 服务-节点视图 -->
          <div v-else-if="activeView === 'service-node'" class="service-node-view">
            <el-collapse v-model="activeServiceGroups">
              <el-collapse-item 
                v-for="serviceGroup in groupedServiceNodes" 
                :key="serviceGroup.serviceName"
                :name="serviceGroup.serviceName"
              >
                <!-- 服务层级标题 -->
                <template #title>
                  <div class="service-group-title">
                    <el-icon><el-service /></el-icon>
                    <span>{{ serviceGroup.serviceName || '未知服务' }}</span>
                    <el-tag size="small" type="success">{{ serviceGroup.totalNodes }}条记录</el-tag>
                  </div>
                </template>
                
                <!-- 节点分组 -->
                <el-collapse v-model="activeNodeGroups[serviceGroup.serviceName]">
                  <el-collapse-item 
                    v-for="nodeGroup in serviceGroup.nodeGroups" 
                    :key="nodeGroup.nodeKey"
                    :name="nodeGroup.nodeKey"
                  >
                    <template #title>
                      <div class="node-group-title">
                        <el-icon><el-connection /></el-icon>
                        <div class="node-info">
                          <span class="node-key">{{ nodeGroup.nodeKey }}</span>
                          <span class="node-name">{{ nodeGroup.nodes[0].node_name }}</span>
                        </div>
                        <el-tooltip 
                          :content="nodeGroup.nodes[0].node_desc || '暂无描述'" 
                          placement="top"
                          :open-delay="300"
                        >
                          <el-icon><el-info-filled /></el-icon>
                        </el-tooltip>
                        <el-tag size="small" type="info">{{ nodeGroup.nodes.length }}</el-tag>
                      </div>
                    </template>
                    
                    <el-table 
                      :data="nodeGroup.nodes" 
                      stripe 
                      style="width: 100%"
                      class="dark-table nested-table"
                    >
                      <el-table-column prop="__created_at" label="创建时间" width="180">
                        <template #default="{ row }">
                          <div class="time-cell">
                            <el-icon><el-timer /></el-icon>
                            {{ formatTime(row.__created_at) }}
                          </div>
                        </template>
                      </el-table-column>
                      <el-table-column prop="endpoint" label="端点" width="180">
                        <template #default="{ row }">
                          <div class="endpoint-cell">
                            <el-icon><el-position /></el-icon>
                            {{ row.endpoint }}
                          </div>
                        </template>
                      </el-table-column>
                      <el-table-column prop="time_cost" label="耗时(ms)" width="120">
                        <template #default="{ row }">
                          <div class="time-cost-cell">
                            <el-icon><el-timer /></el-icon>
                            {{ row.time_cost }}
                          </div>
                        </template>
                      </el-table-column>
                      <el-table-column label="事件数据" min-width="200">
                        <template #default="{ row }">
                          <el-button 
                            type="text" 
                            @click="showEventData(row.event_data)"
                            class="view-btn"
                          >
                            <el-icon><el-document /></el-icon>
                            查看详情
                          </el-button>
                        </template>
                      </el-table-column>
                    </el-table>
                  </el-collapse-item>
                </el-collapse>
              </el-collapse-item>
            </el-collapse>
          </div>

          <!-- 服务-业务类型视图 -->
          <div v-else-if="activeView === 'service-business'" class="service-business-view">
            <el-collapse v-model="activeServiceBusinessGroups">
              <el-collapse-item 
                v-for="serviceGroup in groupedServiceBusiness" 
                :key="serviceGroup.serviceName"
                :name="serviceGroup.serviceName"
              >
                <!-- 服务层级标题 -->
                <template #title>
                  <div class="service-group-title">
                    <el-icon><el-service /></el-icon>
                    <span>{{ serviceGroup.serviceName || '未知服务' }}</span>
                    <el-tag size="small" type="success">{{ serviceGroup.totalNodes }}条记录</el-tag>
                  </div>
                </template>
                
                <!-- 业务类型分组 -->
                <el-collapse v-model="activeBusinessGroups[serviceGroup.serviceName]">
                  <el-collapse-item 
                    v-for="businessGroup in serviceGroup.businessGroups" 
                    :key="businessGroup.businessType"
                    :name="businessGroup.businessType"
                  >
                    <template #title>
                      <div class="business-group-title">
                        <el-icon><el-office-building /></el-icon>
                        <div class="business-info">
                          <span class="business-type">{{ businessGroup.businessType || '未知业务类型' }}</span>
                        </div>
                        <el-tag size="small" type="info">{{ businessGroup.nodes.length }}</el-tag>
                      </div>
                    </template>
                    
                    <el-table 
                      :data="businessGroup.nodes" 
                      stripe 
                      style="width: 100%"
                      class="dark-table nested-table"
                    >
                      <el-table-column prop="__created_at" label="创建时间" width="180">
                        <template #default="{ row }">
                          <div class="time-cell">
                            <el-icon><el-timer /></el-icon>
                            {{ formatTime(row.__created_at) }}
                          </div>
                        </template>
                      </el-table-column>
                      <el-table-column prop="node_key" label="节点" width="180">
                        <template #default="{ row }">
                          <div class="node-cell">
                            <el-icon><el-connection /></el-icon>
                            {{ row.node_key }}
                          </div>
                        </template>
                      </el-table-column>
                      <el-table-column prop="node_name" label="节点名称" width="150">
                        <template #default="{ row }">
                          <div class="node-name-cell">
                            <el-icon><el-price-tag /></el-icon>
                            {{ row.node_name }}
                          </div>
                        </template>
                      </el-table-column>
                      <el-table-column prop="endpoint" label="端点" width="180">
                        <template #default="{ row }">
                          <div class="endpoint-cell">
                            <el-icon><el-position /></el-icon>
                            {{ row.endpoint }}
                          </div>
                        </template>
                      </el-table-column>
                      <el-table-column prop="time_cost" label="耗时(ms)" width="120">
                        <template #default="{ row }">
                          <div class="time-cost-cell">
                            <el-icon><el-timer /></el-icon>
                            {{ row.time_cost }}
                          </div>
                        </template>
                      </el-table-column>
                      <el-table-column label="事件数据" min-width="200">
                        <template #default="{ row }">
                          <el-button 
                            type="text" 
                            @click="showEventData(row.event_data)"
                            class="view-btn"
                          >
                            <el-icon><el-document /></el-icon>
                            查看详情
                          </el-button>
                        </template>
                      </el-table-column>
                    </el-table>
                  </el-collapse-item>
                </el-collapse>
              </el-collapse-item>
            </el-collapse>
          </div>
        </div>
      </div>

      <div v-else-if="activeTab === 'llm_agg'">
        <LlmAgg />
      </div>
    </el-card>

    <!-- 添加最近查询记录抽屉 -->
    <el-drawer
      v-model="drawerVisible"
      title="最近查询记录"
      direction="rtl"
      size="400px"
      :destroy-on-close="false"
      class="history-drawer"
    >
      <div class="drawer-content">
        <!-- 添加环境切换的tabs -->
        <el-tabs v-model="activeEnv" class="env-tabs">
          <el-tab-pane label="开发环境" name="dev">
            <el-timeline>
              <el-timeline-item
                v-for="record in envQueries.dev"
                :key="record.trace_id"
                :timestamp="formatTime(record.__created_at)"
                placement="top"
                type="primary"
              >
                <el-card class="history-card">
                  <div class="query-text">{{ record.query }}</div>
                  <div class="trace-info">
                    <span class="trace-id">{{ record.trace_id }}</span>
                    <el-button 
                      type="primary" 
                      link 
                      @click="handleHistoryQuery(record.trace_id)"
                    >
                      <el-icon><el-search /></el-icon>
                      查询此 Trace
                    </el-button>
                  </div>
                </el-card>
              </el-timeline-item>
            </el-timeline>
          </el-tab-pane>
          
          <el-tab-pane label="测试环境" name="test">
            <el-timeline>
              <el-timeline-item
                v-for="record in envQueries.test"
                :key="record.trace_id"
                :timestamp="formatTime(record.__created_at)"
                placement="top"
                type="primary"
              >
                <el-card class="history-card">
                  <div class="query-text">{{ record.query }}</div>
                  <div class="trace-info">
                    <span class="trace-id">{{ record.trace_id }}</span>
                    <el-button 
                      type="primary" 
                      link 
                      @click="handleHistoryQuery(record.trace_id)"
                    >
                      <el-icon><el-search /></el-icon>
                      查询此 Trace
                    </el-button>
                  </div>
                </el-card>
              </el-timeline-item>
            </el-timeline>
          </el-tab-pane>

          <el-tab-pane label="生产环境" name="prod">
            <el-timeline>
              <el-timeline-item
                v-for="record in envQueries.prod"
                :key="record.trace_id"
                :timestamp="formatTime(record.__created_at)"
                placement="top"
                type="primary"
              >
                <el-card class="history-card">
                  <div class="query-text">{{ record.query }}</div>
                  <div class="trace-info">
                    <span class="trace-id">{{ record.trace_id }}</span>
                    <el-button 
                      type="primary" 
                      link 
                      @click="handleHistoryQuery(record.trace_id)"
                    >
                      <el-icon><el-search /></el-icon>
                      查询此 Trace
                    </el-button>
                  </div>
                </el-card>
              </el-timeline-item>
            </el-timeline>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-drawer>

    <!-- 修改悬浮按钮 -->
    <div class="floating-container">
      <el-tooltip
        content="查看最近的链路追踪记录"
        placement="top"
        :show-after="300"
      >
        <div class="floating-wrapper" @click="handleShowHistory">
          <el-button
            type="primary"
            circle
            class="history-btn"
          >
            <el-icon><el-time /></el-icon>
          </el-button>
          <span class="floating-text">最近查询</span>
        </div>
      </el-tooltip>
    </div>

    <!-- JSON数据弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      title="事件数据详情"
      width="60%"
      @before-close="handleClose"
      custom-class="dark-dialog"
    >
      <json-viewer
        :value="currentEventData"
        :expand-depth="2"
        copyable
        boxed
        sort
        class="dark-json"
      />
    </el-dialog>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import JsonViewer from 'vue-json-viewer'
import LlmAgg from './LlmAgg.vue'
import 'vue-json-viewer/style.css'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  View,
  Key,
  Search,
  Timer,
  Connection,
  Service,
  Share,
  Position,
  OfficeBuilding,
  InfoFilled,
  PriceTag,
  Document,
  Time,
  DataAnalysis
} from '@element-plus/icons-vue'

export default {
  name: 'TraceQuery',
  components: {
    JsonViewer,
    LlmAgg,
    // 注册图标组件
    ElView: View,
    ElKey: Key,
    ElSearch: Search,
    ElTimer: Timer,
    ElConnection: Connection,
    ElService: Service,
    ElShare: Share,
    ElPosition: Position,
    ElOfficeBuilding: OfficeBuilding,
    ElInfoFilled: InfoFilled,
    ElPriceTag: PriceTag,
    ElDocument: Document,
    ElTime: Time,
    ElDataAnalysis: DataAnalysis
  },
  setup() {
    const route = useRoute()
    const queryForm = ref({
      traceId: ''
    })
    const traceNodes = ref([])
    const dialogVisible = ref(false)
    const currentEventData = ref(null)
    const nodeKeyOptions = ref([])
    const businessTypeOptions = ref([])
    const fromServiceOptions = ref([])
    const isLoading = ref(false)
    const activeView = ref('timeline')
    const activeGroups = ref([])
    const activeServiceGroups = ref([])
    const activeNodeGroups = ref({})
    const drawerVisible = ref(false)
    const latestQueries = ref([])
    const activeServiceBusinessGroups = ref([])
    const activeBusinessGroups = ref({})
    const activeEnv = ref('dev')
    const envQueries = ref({
      dev: [],
      test: [],
      prod: []
    })
    const ragInfo = ref({
      env: '',
      messageId: '',
      query: ''
    })
    const paramConfig = ref({})

    // 计算属性
    const groupedNodes = computed(() => {
      // 按 node_key 分组
      const groups = {};
      traceNodes.value.forEach(node => {
        if (!groups[node.node_key]) {
          groups[node.node_key] = {
            nodeKey: node.node_key,
            nodes: []
          };
        }
        groups[node.node_key].nodes.push(node);
      });
      
      // 转换为数组并按节点数量降序排序
      return Object.values(groups).sort((a, b) => b.nodes.length - a.nodes.length);
    })

    const groupedServices = computed(() => {
      // 按 from_service 分组
      const groups = {};
      traceNodes.value.forEach(node => {
        if (!groups[node.from_service]) {
          groups[node.from_service] = {
            serviceName: node.from_service,
            nodes: []
          };
        }
        groups[node.from_service].nodes.push(node);
      });
      
      // 转换为数组并按节点数量降序排序
      return Object.values(groups).sort((a, b) => b.nodes.length - a.nodes.length);
    })

    const groupedServiceNodes = computed(() => {
      const serviceGroups = {};
      
      // 首先按服务分组
      traceNodes.value.forEach(node => {
        const serviceName = node.from_service || '未知服务';
        if (!serviceGroups[serviceName]) {
          serviceGroups[serviceName] = {
            serviceName: serviceName,
            nodeGroups: {},
            totalNodes: 0,
            firstTimestamp: node.__created_at // 记录该服务的第一个节点时间
          };
        } else {
          // 更新服务的最早时间戳
          serviceGroups[serviceName].firstTimestamp = Math.min(
            serviceGroups[serviceName].firstTimestamp,
            node.__created_at
          );
        }
        
        // 在每个服务内按节点分组
        const nodeKey = node.node_key;
        if (!serviceGroups[serviceName].nodeGroups[nodeKey]) {
          serviceGroups[serviceName].nodeGroups[nodeKey] = {
            nodeKey: nodeKey,
            nodes: [],
            firstTimestamp: node.__created_at // 记录该节点的第一个时间
          };
        } else {
          // 更新节点的最早时间戳
          serviceGroups[serviceName].nodeGroups[nodeKey].firstTimestamp = Math.min(
            serviceGroups[serviceName].nodeGroups[nodeKey].firstTimestamp,
            node.__created_at
          );
        }
        
        serviceGroups[serviceName].nodeGroups[nodeKey].nodes.push(node);
        serviceGroups[serviceName].totalNodes++;
      });
      
      // 转换为数组格式并按时间戳排序
      return Object.values(serviceGroups)
        .map(service => ({
          ...service,
          // 对每个服务内的节点按时间戳排序
          nodeGroups: Object.values(service.nodeGroups)
            .sort((a, b) => a.firstTimestamp - b.firstTimestamp)
        }))
        // 对服务按时间戳排序
        .sort((a, b) => a.firstTimestamp - b.firstTimestamp);
    })

    const groupedServiceBusiness = computed(() => {
      const serviceGroups = {};
      
      // 首先按服务分组
      traceNodes.value.forEach(node => {
        const serviceName = node.from_service || '未知服务';
        if (!serviceGroups[serviceName]) {
          serviceGroups[serviceName] = {
            serviceName: serviceName,
            businessGroups: {},
            totalNodes: 0,
            firstTimestamp: node.__created_at
          };
        } else {
          serviceGroups[serviceName].firstTimestamp = Math.min(
            serviceGroups[serviceName].firstTimestamp,
            node.__created_at
          );
        }
        
        // 在每个服务内按业务类型分组
        const businessType = node.business_type || '未知业务类型';
        if (!serviceGroups[serviceName].businessGroups[businessType]) {
          serviceGroups[serviceName].businessGroups[businessType] = {
            businessType: businessType,
            nodes: [],
            firstTimestamp: node.__created_at
          };
        } else {
          serviceGroups[serviceName].businessGroups[businessType].firstTimestamp = Math.min(
            serviceGroups[serviceName].businessGroups[businessType].firstTimestamp,
            node.__created_at
          );
        }
        
        serviceGroups[serviceName].businessGroups[businessType].nodes.push(node);
        serviceGroups[serviceName].totalNodes++;
      });
      
      // 转换为数组格式并按时间戳排序
      return Object.values(serviceGroups)
        .map(service => ({
          ...service,
          // 对每个服务内的业务类型按时间戳排序
          businessGroups: Object.values(service.businessGroups)
            .sort((a, b) => a.firstTimestamp - b.firstTimestamp)
        }))
        // 对服务按时间戳排序
        .sort((a, b) => a.firstTimestamp - b.firstTimestamp);
    })

    // 方法
    const handleQuery = async () => {
      if (!queryForm.value.traceId) {
        ElMessage.warning('请输入 Trace ID')
        return
      }

      try {
        isLoading.value = true
        // 并行发送两个请求
        const [searchResponse, configResponse] = await Promise.all([
          axios.post('/api/tracer/search', {
            trace_id: queryForm.value.traceId
          }),
          axios.post('/api/tracer/param_config')
        ])

        // 处理参数配置响应
        if (configResponse.data.errno === 0) {
          paramConfig.value = configResponse.data.data
        }

        // 处理搜索响应
        if (searchResponse.data.data) {
          traceNodes.value = searchResponse.data.data.sort((a, b) => a.__created_at - b.__created_at)
          updateFilterOptions()
          
          const startRagNode = traceNodes.value.find(node => node.node_key === 'start_rag')
          if (startRagNode && startRagNode.event_data) {
            const eventData = typeof startRagNode.event_data === 'string' 
              ? JSON.parse(startRagNode.event_data) 
              : startRagNode.event_data
              
            ragInfo.value = {
              env: eventData.env || 'prod',
              messageId: eventData.message_id || '[empty]',
              query: eventData.query || '[empty]'
            }
          } else {
            ragInfo.value = { env: '', messageId: '', query: '' }
          }
        } else {
          traceNodes.value = []
          clearFilterOptions()
          ragInfo.value = { env: '', messageId: '', query: '' }
          ElMessage.warning('未找到相关数据')
        }
      } catch (error) {
        ElMessage.error('查询失败：' + error.message)
      } finally {
        isLoading.value = false
      }
    }

    const formatTime = (timestamp) => {
      const date = new Date(timestamp * 1000);
      const localeDateStr = date.toLocaleString();
      const milliseconds = String(timestamp).split('.')[1] || '00';
      return `${localeDateStr}.${milliseconds.substring(0, 2)}`;
    }

    const showEventData = (data) => {
      currentEventData.value = data
      dialogVisible.value = true

      // 添加自定义渲染器
      setTimeout(() => {
        const jsonViewer = document.querySelector('.jv-container')
        if (jsonViewer) {
          const keys = jsonViewer.querySelectorAll('.jv-key')
          keys.forEach(key => {
            const paramKey = key.textContent.replace(':', '')
            const paramInfo = paramConfig.value[paramKey]
            if (paramInfo) {
              key.setAttribute('data-type', paramInfo.param_type || '未知类型')
              key.setAttribute('data-desc', paramInfo.param_desc || '暂无描述')
            }
          })
        }
      }, 100)
    }

    const handleClose = () => {
      dialogVisible.value = false
      currentEventData.value = null
    }

    const updateFilterOptions = () => {
      nodeKeyOptions.value = [...new Set(traceNodes.value.map(node => node.node_key))]
        .map(value => ({ text: value, value }))
      
      businessTypeOptions.value = [...new Set(traceNodes.value.map(node => node.business_type))]
        .map(value => ({ text: value, value }))
      
      fromServiceOptions.value = [...new Set(traceNodes.value.map(node => node.from_service))]
        .map(value => ({ text: value, value }))
    }

    const clearFilterOptions = () => {
      nodeKeyOptions.value = []
      businessTypeOptions.value = []
      fromServiceOptions.value = []
    }

    const handleColumnFilter = (value, row, column) => {
      const property = column.property
      return row[property] === value
    }

    const handleViewChange = (tab) => {
      activeView.value = tab.name
    }

    // 获取最近查询记录
    const fetchLatestQueries = async () => {
      try {
        const response = await axios.post('/api/tracer/latest_query_list')
        if (response.data.errno === 0) {
          // 更新环境分组数据
          envQueries.value = response.data.data
        } else {
          ElMessage.warning('获取历史记录失败：' + response.data.errmsg)
        }
      } catch (error) {
        ElMessage.error('获取历史记录失败：' + error.message)
      }
    }

    // 处理历史记录查询
    const handleHistoryQuery = async (traceId) => {
      queryForm.value.traceId = traceId
      handleQuery()
      drawerVisible.value = false
    }

    // 修改点击最近查询按钮的处理方法
    const handleShowHistory = async () => {
      try {
        // 打开抽屉前先获取最新数据
        await fetchLatestQueries()
        drawerVisible.value = true
      } catch (error) {
        ElMessage.error('获取历史记录失败：' + error.message)
      }
    }

    // 组件挂载时获取历史记录
    onMounted(() => {
      fetchLatestQueries()
    })

    // 初始化
    if (route.query.traceId) {
      queryForm.value.traceId = route.query.traceId
      handleQuery()
    }

    const handleIconClick = () => {
      window.open('https://www.baidu.com', '_blank')
    }

    // 添加当前激活菜单的计算属性
    const activeMenu = computed(() => route.path)

    // 添加 tab 切换相关的响应式变量和方法
    const activeTab = ref('trace')

    const handleTabChange = (tab) => {
      activeTab.value = tab
    }

    return {
      queryForm,
      traceNodes,
      dialogVisible,
      currentEventData,
      nodeKeyOptions,
      businessTypeOptions,
      fromServiceOptions,
      isLoading,
      activeView,
      activeGroups,
      activeServiceGroups,
      activeNodeGroups,
      groupedNodes,
      groupedServices,
      groupedServiceNodes,
      handleQuery,
      formatTime,
      showEventData,
      handleClose,
      updateFilterOptions,
      clearFilterOptions,
      handleColumnFilter,
      handleViewChange,
      drawerVisible,
      latestQueries,
      handleHistoryQuery,
      activeServiceBusinessGroups,
      activeBusinessGroups,
      groupedServiceBusiness,
      handleShowHistory,
      activeEnv,
      envQueries,
      ragInfo,
      handleIconClick,
      paramConfig,
      activeMenu,
      activeTab,
      handleTabChange,
    }
  }
}
</script>

<style scoped>
.trace-query {
  padding: 20px;
  min-height: 100vh;
  background: #f5f7fa;
}

.dark-theme {
  background: #fff;
  border: none;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  overflow: hidden;
  border-top: none;
}

.card-header {
  background: linear-gradient(135deg, #409EFF 0%, #66b1ff 100%);
  margin: -20px -20px 20px;
  padding: 20px;
  border-bottom: none;
  text-align: left;
  position: relative;
  overflow: hidden;
}

.card-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, rgba(255,255,255,0.1) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.1) 75%, transparent 75%, transparent);
  background-size: 20px 20px;
  animation: moveStripes 30s linear infinite;
  opacity: 0.3;
}

@keyframes moveStripes {
  0% {
    background-position: 0 0;
  }
  100% {
    background-position: 50px 50px;
  }
}

.title {
  color: #fff;
  font-size: 28px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0,0,0,0.1);
  position: relative;
  z-index: 1;
  margin-left: 10px;
}

.title i {
  font-size: 32px;
  color: #fff;
  background: rgba(255,255,255,0.2);
  padding: 12px;
  border-radius: 12px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
  cursor: pointer;
}

.title i:hover {
  transform: scale(1.1) rotate(15deg);
  background: rgba(255,255,255,0.3);
}

.dark-input >>> .el-input__inner {
  background: #fff;
  border: 1px solid #dcdfe6;
  color: #606266;
}

.search-btn {
  background: #409EFF;
  border-color: #409EFF;
}

.dark-table {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.dark-table >>> .el-table__header-wrapper th {
  background: #f5f7fa;
  color: #606266;
  border-bottom: 1px solid #ebeef5;
  font-weight: 500;
  /* text-align: center !important; */
}

.dark-table >>> .el-table__body-wrapper td {
  background: #fff;
  color: #606266;
  border-bottom: 1px solid #ebeef5;
}

.dark-table >>> .el-table--striped .el-table__body tr.el-table__row--striped td {
  background: #fafafa;
}

.node-cell,
.time-cell,
.endpoint-cell,
.time-cost-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #606266;
}

.node-cell i,
.time-cell i,
.endpoint-cell i,
.time-cost-cell i {
  color: #909399;
  font-size: 14px;
}

.view-btn {
  color: #409EFF;
  transition: all 0.3s;
}

.view-btn:hover {
  color: #66b1ff;
  transform: scale(1.05);
}

.dark-dialog {
  background: #fff;
  border-radius: 8px;
}

.dark-dialog >>> .el-dialog__title {
  color: #303133;
  font-weight: 500;
}

.dark-dialog >>> .el-dialog__header {
  background: #fff;
  padding: 20px;
  border-bottom: 1px solid #ebeef5;
}

.dark-dialog >>> .el-dialog__body {
  background: #fff;
  color: #606266;
  padding: 20px;
}

.dark-json {
  background: #f5f7fa;
  border-radius: 4px;
  padding: 15px;
}

.dark-json >>> .jv-container {
  background: #f5f7fa;
  color: #606266;
}

.dark-json >>> .jv-container.boxed {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
}

.dark-json >>> .jv-node {
  margin-left: 20px;
  position: relative;
}

.dark-json >>> .jv-node:after {
  content: ',';
  color: #909399;
}

.dark-json >>> .jv-node:last-of-type:after {
  display: none;
}

/* 优化不同类型值的颜色 */
.dark-json >>> .jv-item.jv-string {
  color: #67C23A;
}

.dark-json >>> .jv-item.jv-number {
  color: #E6A23C;
}

.dark-json >>> .jv-item.jv-boolean {
  color: #F56C6C;
}

.dark-json >>> .jv-item.jv-null {
  color: #909399;
}

.dark-json >>> .jv-item {
  margin: 8px 0;  /* 从原来的 2px 改为 8px */
  line-height: 1.8;  /* 增加行高 */
}

/* 对象和数组内的缩进项也调整间距 */
.dark-json >>> .jv-node {
  margin: 4px 0 4px 20px;  /* 增加上下间距 */
}

/* 确保最后一个项目也有合适的间距 */
.dark-json >>> .jv-node:last-child {
  margin-bottom: 8px;
}

/* 调整折叠/展开按钮的位置，以配合新的行距 */
.dark-json >>> .jv-toggle {
  margin-top: 4px;  /* 调整折叠按钮的位置 */
}

/* 优化展开/折叠图标 */
.dark-json >>> .jv-more:hover {
  color: #409EFF;
}

.dark-json >>> .jv-toggle {
  background-color: #f4f4f5;
  border-radius: 3px;
  margin-left: -15px;
  margin-right: 5px;
  padding: 0 3px;
  transition: all 0.2s;
}

.dark-json >>> .jv-toggle:hover {
  background-color: #e9e9eb;
}

/* 添加一些柔和的动画效果 */
.el-table__body tr {
  transition: all 0.3s;
}

.el-table__body tr:hover > td {
  background: #f5f7fa !important;
}

/* 移除渐变边框，改用简单的顶部边框 */
.dark-theme::before {
  display: none;
}

/* 添加卡片顶部装饰 */
.dark-theme {
  border-top: 3px solid #409EFF;
}

.business-type-cell,
.service-cell,
.node-desc-cell,
.node-name-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #606266;
}

.business-type-cell i,
.service-cell i,
.node-desc-cell i,
.node-name-cell i {
  color: #909399;
  font-size: 14px;
}

.el-table-column--filter-trigger {
  background-color: #f5f7fa;
}

.el-table-filter__bottom {
  border-top: 1px solid #ebeef5;
}

.el-table-filter__list {
  padding: 5px 0;
  margin: 0;
  background-color: #fff;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,.1);
}

/* 添加筛选图标的悬停效果 */
.dark-table >>> .el-table__column-filter-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 24px;
  width: 24px;
  line-height: 24px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.dark-table >>> .el-table__column-filter-trigger:hover {
  background-color: #e6e9ee;
  color: #409EFF;
}

/* 当列有筛选条件时的样式 */
.dark-table >>> .el-table__column-filter-trigger.is-active {
  color: #409EFF;
}

/* 优化筛选下拉面板的样式 */
.dark-table >>> .el-table-filter {
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
}

.dark-table >>> .el-table-filter__list-item {
  padding: 8px 16px;
  transition: background-color 0.2s;
}

.dark-table >>> .el-table-filter__list-item:hover {
  background-color: #f5f7fa;
  color: #409EFF;
}

.dark-table >>> .el-table-filter__list-item.is-active {
  background-color: #ecf5ff;
  color: #409EFF;
}

.view-tabs {
  margin-top: 20px;
}

.view-tabs >>> .el-tabs__nav {
  border: none;
}

.view-tabs >>> .el-tabs__nav-scroll {
  padding: 0;
}

.view-tabs >>> .el-tabs__item {
  padding: 10px 20px;
  font-weight: 500;
  color: #606266;
  transition: all 0.3s;
}

.view-tabs >>> .el-tabs__item:hover {
  color: #409EFF;
}

.view-tabs >>> .el-tabs__item.is-active {
  color: #409EFF;
  border-bottom: 2px solid #409EFF;
}

.node-view {
  margin-top: 20px;
}

.group-title {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #606266;
  font-weight: 500;
  padding: 8px 0;
}

.group-title .node-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.group-title .node-key {
  color: #303133;
  font-weight: 500;
}

.group-title .node-name {
  color: #606266;
  font-size: 14px;
  background: #f5f7fa;
  padding: 2px 8px;
  border-radius: 4px;
}

.group-title .node-desc-icon {
  color: #909399;
  font-size: 16px;
  cursor: help;
  transition: all 0.3s;
}

.group-title .node-desc-icon:hover {
  color: #409EFF;
  transform: scale(1.1);
}

/* 优化 tooltip 样式 */
.el-tooltip__popper {
  max-width: 300px;
  line-height: 1.5;
}

.nested-table {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.nested-table >>> .el-table__header-wrapper th {
  background: #f5f7fa;
  color: #606266;
  border-bottom: 1px solid #ebeef5;
  font-weight: 500;
  /* text-align: center !important; */
}

.nested-table >>> .el-table__body-wrapper td {
  background: #fff;
  color: #606266;
  border-bottom: 1px solid #ebeef5;
}

.nested-table >>> .el-table--striped .el-table__body tr.el-table__row--striped td {
  background: #fafafa;
}

.nested-table >>> .el-table-column--filter-trigger {
  background-color: #f5f7fa;
}

.nested-table >>> .el-table-filter__bottom {
  border-top: 1px solid #ebeef5;
}

.nested-table >>> .el-table-filter__list {
  padding: 5px 0;
  margin: 0;
  background-color: #fff;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,.1);
}

.nested-table >>> .el-table-filter__list-item {
  padding: 8px 16px;
  transition: background-color 0.2s;
}

.nested-table >>> .el-table-filter__list-item:hover {
  background-color: #f5f7fa;
  color: #409EFF;
}

.nested-table >>> .el-table-filter__list-item.is-active {
  background-color: #ecf5ff;
  color: #409EFF;
}

/* 优化表单样式 */
.query-form {
  background: #f8faff;  /* 添加浅色背景 */
  padding: 24px;
  border-radius: 8px;
  border: 1px dashed #c0d3ff;  /* 添加虚线边框 */
  margin-top: 10px;
}

/* 优化标签样式 */
.query-form >>> .el-form-item__label {
  font-size: 15px;
  font-weight: 500;
  color: #303133;
}

/* 优化输入框样式 */
.dark-input >>> .el-input__inner {
  height: 44px;  /* 增加输入框高度 */
  line-height: 44px;
  font-size: 15px;
  padding-left: 15px;
  border-color: #c0d3ff;
  transition: all 0.3s;
}

.dark-input >>> .el-input__inner:hover {
  border-color: #409EFF;
}

.dark-input >>> .el-input__inner:focus {
  border-color: #409EFF;
  box-shadow: 0 0 0 2px rgba(64,158,255,.2);
}

/* 优化搜索按钮样式 */
.search-btn {
  height: 44px;  /* 匹配输入框高度 */
  padding: 0 20px;
  font-size: 15px;
  font-weight: 500;
}

/* 添加 Trace ID 的图标样式 */
.query-form >>> .el-form-item__label::before {
  content: "\e6df";  /* 使用 element-ui 的图标 */
  font-family: element-icons !important;
  margin-right: 5px;
  color: #409EFF;
}

/* 添加输入框的占位符样式 */
.dark-input >>> .el-input__inner::placeholder {
  color: #909399;
  font-size: 14px;
}

/* 添加响应式样式 */
@media screen and (max-width: 768px) {
  .title {
    font-size: 24px;
  }
  
  .title i {
    font-size: 28px;
    padding: 10px;
  }
  
  .card-header {
    padding: 25px 15px;
  }
}

.service-group-title {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #606266;
  font-weight: 500;
  padding: 8px 0;
}

.service-group-title .node-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.service-group-title .node-key {
  color: #303133;
  font-weight: 500;
}

.service-group-title .node-name {
  color: #606266;
  font-size: 14px;
  background: #f5f7fa;
  padding: 2px 8px;
  border-radius: 4px;
}

.service-group-title .node-desc-icon {
  color: #909399;
  font-size: 16px;
  cursor: help;
  transition: all 0.3s;
}

.service-group-title .node-desc-icon:hover {
  color: #409EFF;
  transform: scale(1.1);
}

.node-group-title {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #606266;
  font-weight: 500;
  padding: 8px 0;
  margin-left: 20px;
}

/* 优化嵌套折叠面板的样式 */
.service-node-view >>> .el-collapse-item__content {
  padding: 10px;
}

.service-node-view >>> .el-collapse-item__header {
  background: #f8faff;
  border-radius: 6px;
}

.service-node-view .el-collapse-item >>> .el-collapse-item__header {
  background: #fff;
  margin: 5px 0;
}

.history-drawer >>> .el-drawer__header {
  margin-bottom: 0;
  padding: 20px;
  border-bottom: 1px solid #ebeef5;
  color: #303133;
  font-weight: 600;
  font-size: 18px;
}

.drawer-content {
  padding: 20px;
}

.history-card {
  margin-bottom: 10px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.05);
}

.query-text {
  color: #303133;
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 10px;
  word-break: break-all;
}

.trace-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}

.trace-id {
  color: #909399;
  font-family: monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
}

/* 替换原有的 floating-btn 相关样式 */
.floating-container {
  position: fixed;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 1000;
  transition: all 0.3s ease;
}

.floating-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(64, 158, 255, 0.1);
  padding: 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid rgba(64, 158, 255, 0.2);
}

.floating-wrapper:hover {
  background: rgba(64, 158, 255, 0.15);
  transform: translateX(-5px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
}

.history-btn {
  width: 40px;
  height: 40px;
  padding: 8px;
  background: #409EFF;
  border: none;
  margin-bottom: 6px;
}

.floating-text {
  color: #409EFF;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  opacity: 1;
  transition: all 0.3s ease;
}

/* 响应式样式调整 */
@media screen and (max-width: 768px) {
  .floating-container {
    right: 10px;
  }

  .floating-wrapper {
    padding: 8px;
  }

  .history-btn {
    width: 32px;
    height: 32px;
    padding: 6px;
  }

  .floating-text {
    font-size: 11px;
  }
}

/* 修改动画效果 */
@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(64, 158, 255, 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(64, 158, 255, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(64, 158, 255, 0);
  }
}

.floating-wrapper {
  animation: pulse 2s infinite;
}

.business-group-title {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #606266;
  font-weight: 500;
  padding: 8px 0;
  margin-left: 20px;
}

.business-group-title .business-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.business-group-title .business-type {
  color: #303133;
  font-weight: 500;
  background: #f5f7fa;
  padding: 2px 8px;
  border-radius: 4px;
}

.service-business-view >>> .el-collapse-item__content {
  padding: 10px;
}

.service-business-view >>> .el-collapse-item__header {
  background: #f8faff;
  border-radius: 6px;
}

.service-business-view .el-collapse-item >>> .el-collapse-item__header {
  background: #fff;
  margin: 5px 0;
}

.env-tabs {
  margin-bottom: 20px;
}

.env-tabs >>> .el-tabs__header {
  margin-bottom: 15px;
}

.env-tabs >>> .el-tabs__nav-wrap::after {
  height: 1px;
  background-color: #e4e7ed;
}

.env-tabs >>> .el-tabs__item {
  font-size: 14px;
  height: 40px;
  line-height: 40px;
}

.env-tabs >>> .el-tabs__item.is-active {
  font-weight: 500;
}

.env-tabs >>> .el-tabs__active-bar {
  height: 2px;
}

/* 优化时间线样式 */
.el-timeline >>> .el-timeline-item__node {
  background-color: #409EFF;
}

.el-timeline >>> .el-timeline-item__tail {
  border-left-color: #e4e7ed;
}

.el-timeline >>> .el-timeline-item__timestamp {
  color: #909399;
  font-size: 13px;
}

/* 当没有数据时的提示样式 */
.el-timeline:empty::before {
  content: "暂无查询记录";
  display: block;
  text-align: center;
  color: #909399;
  padding: 20px 0;
  font-size: 14px;
}

/* RAG 信息展示区域样式 */
.rag-info-container {
  margin: 16px 0;
}

.rag-info {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding: 12px;
  background: rgba(255, 236, 184, 0.3);
  border: 1px solid rgba(230, 162, 60, 0.2);
  border-radius: 8px;
}

.rag-item {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 200px;
}

.rag-label {
  font-weight: 500;
  color: #606266;
  white-space: nowrap;
}

.rag-value {
  flex: 1;
  padding: 4px 8px;
  background: rgba(255, 236, 184, 0.5);
  border-radius: 4px;
  color: #b88230;
  word-break: break-all;
}

/* 新的 RAG 信息区域样式 */
.rag-info-section {
  margin: 16px 0;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
}

.rag-info-header {
  background: #f5f7fa;
  padding: 12px 16px;
  font-weight: 500;
  color: #606266;
  border-bottom: 1px solid #e4e7ed;
}

.rag-info-content {
  padding: 16px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
  background: #fff;
}

.rag-info-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rag-info-label {
  font-size: 13px;
  color: #909399;
}

.rag-info-value {
  padding: 8px 12px;
  background: rgba(255, 236, 184, 0.3);
  border: 1px solid rgba(230, 162, 60, 0.2);
  border-radius: 4px;
  color: #b88230;
  font-size: 14px;
  line-height: 1.4;
  word-break: break-all;
}

/* 添加全屏 loading 样式 */
.query-card >>> .el-loading-mask {
  background-color: rgba(255, 255, 255, 0.9);
  z-index: 1000;
}

.query-card >>> .el-loading-spinner {
  top: 25%;
}

.query-card >>> .el-loading-spinner .el-loading-text {
  color: #409EFF;
  font-size: 16px;
  margin: 12px 0;
}

.query-card >>> .el-loading-spinner .path {
  stroke: #409EFF;
}

.dark-json >>> .jv-key {
  position: relative;
  cursor: help;
}

.dark-json >>> .jv-key[title] {
  border-bottom: 1px dashed #909399;
}

.dark-json >>> .jv-key[title]:hover::after {
  content: attr(title);
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  padding: 8px 12px;
  background: rgba(48, 49, 51, 0.95);
  color: #fff;
  border-radius: 4px;
  font-size: 12px;
  white-space: pre-line;
  z-index: 1000;
  min-width: 200px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.dark-json >>> .jv-key[title]:hover::before {
  content: '';
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 6px solid transparent;
  border-top-color: rgba(48, 49, 51, 0.95);
  margin-bottom: -6px;
}

/* 添加二级菜单样式 */
.sub-menu {
  margin: -10px -20px 20px;
  border-bottom: 1px solid #e4e7ed;
  background: #fff;
}

.sub-menu-list {
  border: none;
  padding: 0 20px;
}

.sub-menu-list >>> .el-menu-item {
  height: 46px;
  line-height: 46px;
  font-size: 14px;
  color: #606266;
  padding: 0 24px;
}

.sub-menu-list >>> .el-menu-item:hover {
  color: #409EFF;
  background: #ecf5ff;
}

.sub-menu-list >>> .el-menu-item.is-active {
  color: #409EFF;
  font-weight: 500;
  border-bottom: 2px solid #409EFF;
}

.sub-menu-list >>> .el-menu-item i {
  margin-right: 8px;
  font-size: 16px;
}

/* 响应式调整 */
@media screen and (max-width: 768px) {
  .sub-menu-list >>> .el-menu-item {
    padding: 0 16px;
    font-size: 13px;
  }
}

/* 添加模型统计相关样式 */
.llm-statistics {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
}

.llm-statistics h3 {
  margin: 0 0 20px;
  color: #303133;
  font-size: 18px;
  font-weight: 500;
}
</style>