<template>
  <div style="font-size: 24px; font-weight: bold;">Python/Shell 脚本</div>
  <a-divider></a-divider>
  <div class="script">
    <a-table
      :style="`font-size: ${isMobile() ? '12px': '14px'};`"
      :columns="columns"
      size="small"
      :data-source="scripts"
      :pagination="false"
      :scroll="{ x: 640 }"
    >
      <template #title>
        <span style="font-size: 16px; font-weight: bold;">脚本列表</span>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'enable'">
          <a-tag color="success" v-if="record.enable">启用</a-tag>
          <a-tag color="error" v-if="!record.enable">禁用</a-tag>
        </template>
        <template v-if="column.dataIndex === 'interpreter'">
          <a-tag color="blue">{{ record.interpreter }}</a-tag>
        </template>
        <template v-if="column.title === '操作'">
          <span>
            <a @click="modifyClick(record)">编辑</a>
            <a-divider type="vertical" />
            <a @click="showLogs(record)">日志</a>
            <a-divider type="vertical" />
            <a-popover title="删除?" trigger="click" :overlayStyle="{ width: '84px', overflow: 'hidden' }">
              <template #content>
                <a-button type="primary" danger @click="deleteScript(record)" size="small">删除</a-button>
              </template>
              <a style="color: red">删除</a>
            </a-popover>
          </span>
        </template>
      </template>
    </a-table>
    <a-divider></a-divider>
    <div style="font-size: 16px; font-weight: bold; padding-left: 8px;">新增 | 编辑脚本</div>
    <div style="text-align: left; ">
      <a-form
        labelAlign="right"
        :labelWrap="true"
        :model="script"
        size="small"
        @finish="modifyScript"
        :labelCol="{ span: 3 }"
        :wrapperCol="{ span: 21 }"
        autocomplete="off"
        :class="`container-form-${ isMobile() ? 'mobile' : 'pc' }`">
        <a-form-item
          label="别名"
          name="alias"
          extra="给脚本取一个好记的名字"
          :rules="[{ required: true, message: '${label}不可为空!' }]">
          <a-input size="small" v-model:value="script.alias"/>
        </a-form-item>
        <a-form-item
          label="启用"
          name="enable"
          extra="选择是否启用定时执行">
          <a-checkbox v-model:checked="script.enable">启用</a-checkbox>
        </a-form-item>
        <a-form-item
          label="执行周期"
          name="cron"
          extra="Cron 表达式，如 0 8 * * * 每天8点执行"
          :rules="[{ required: true, message: '${label}不可为空!' }]">
          <a-input size="small" v-model:value="script.cron" placeholder="0 8 * * *"/>
        </a-form-item>

        <a-form-item
          label="解释器"
          name="interpreter"
          extra="选择用于执行代码的解释器">
          <a-select 
            size="small" 
            v-model:value="script.interpreter"
            style="width: 200px;">
            <a-select-option value="python3">python3</a-select-option>
            <a-select-option value="python">python</a-select-option>
            <a-select-option value="bash">bash</a-select-option>
            <a-select-option value="sh">sh</a-select-option>
            <a-select-option value="node">node</a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item
          label="代码"
          name="codeContent"
          extra="直接粘贴 Python/Shell 代码"
          :rules="[{ required: true, message: '代码不可为空!' }]">
          <a-textarea 
            size="small" 
            v-model:value="script.codeContent" 
            :rows="18"
            placeholder="# 直接粘贴你的 Python/Shell 代码&#10;# 例如:&#10;import requests&#10;print('Hello from VERTEX!')"/>
        </a-form-item>

        <a-form-item
          label="超时时间"
          name="timeout"
          extra="脚本执行超时时间（秒），默认 300 秒">
          <a-input-number 
            size="small" 
            v-model:value="script.timeout"
            :min="1"
            :max="86400"
            style="width: 120px;"/>
          <span style="margin-left: 8px;">秒</span>
        </a-form-item>

        <a-form-item
          label="环境变量"
          name="envVars"
          extra="设置脚本执行时的环境变量，如 COOKIE、API_KEY 等">
          <div class="env-vars-editor">
            <div 
              v-for="(envVar, index) in script.envVars" 
              :key="index" 
              class="env-var-row">
              <a-input 
                size="small" 
                v-model:value="envVar.key"
                placeholder="变量名"
                style="width: 150px; margin-right: 8px;"/>
              <a-input-password 
                size="small" 
                v-model:value="envVar.value"
                placeholder="变量值"
                style="width: 250px; margin-right: 8px;"
                :visibilityToggle="true"/>
              <a-button 
                size="small" 
                type="text" 
                danger 
                @click="removeEnvVar(index)">
                <template #icon><delete-outlined /></template>
              </a-button>
            </div>
            <a-button 
              size="small" 
              type="dashed" 
              @click="addEnvVar"
              style="margin-top: 8px;">
              <template #icon><plus-outlined /></template>
              添加环境变量
            </a-button>
          </div>
        </a-form-item>

        <a-form-item
          :wrapperCol="isMobile() ? { span:24 } : { span: 21, offset: 3 }">
          <a-button type="primary" html-type="submit" style="margin-top: 24px; margin-bottom: 48px;">保存</a-button>
          <a-button type="primary" @click="run" style="margin-left: 12px; margin-top: 24px; margin-bottom: 48px;">立即执行</a-button>
          <a-button style="margin-left: 12px; margin-top: 24px; margin-bottom: 48px;" @click="clearScript()">清空</a-button>
        </a-form-item>
      </a-form>
    </div>

    <!-- Execution Logs Modal -->
    <a-modal
      v-model:open="logsModalVisible"
      :title="`执行日志 - ${logsScriptAlias}`"
      :width="800"
      :footer="null"
      @cancel="closeLogsModal">
      <div class="execution-logs">
        <a-spin :spinning="logsLoading">
          <div v-if="executionLogs.length === 0" class="no-logs">
            <a-empty description="暂无执行日志" />
          </div>
          <a-collapse v-else accordion>
            <a-collapse-panel 
              v-for="(log, index) in executionLogs" 
              :key="index"
              :header="formatLogHeader(log)">
              <template #extra>
                <a-tag :color="log.success ? 'success' : 'error'">
                  {{ log.success ? '成功' : '失败' }}
                </a-tag>
                <a-tag v-if="log.timedOut" color="warning">超时</a-tag>
              </template>
              <div class="log-details">
                <div class="log-info">
                  <span><strong>退出码:</strong> {{ log.exitCode }}</span>
                  <span><strong>耗时:</strong> {{ formatDuration(log.duration) }}</span>
                </div>
                <div v-if="log.stdout" class="log-output">
                  <div class="log-label">标准输出:</div>
                  <pre class="log-content">{{ log.stdout }}</pre>
                </div>
                <div v-if="log.stderr" class="log-output">
                  <div class="log-label">错误输出:</div>
                  <pre class="log-content log-error">{{ log.stderr }}</pre>
                </div>
              </div>
            </a-collapse-panel>
          </a-collapse>
        </a-spin>
      </div>
    </a-modal>
  </div>
</template>

<script>
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons-vue';

export default {
  components: {
    DeleteOutlined,
    PlusOutlined
  },
  data () {
    const columns = [
      { title: 'ID', dataIndex: 'id', width: 18, fixed: true },
      { title: '别名', dataIndex: 'alias', width: 20 },
      { title: '解释器', dataIndex: 'interpreter', width: 15 },
      { title: '启用', dataIndex: 'enable', width: 15 },
      { title: '周期', dataIndex: 'cron', width: 24 },
      { title: '操作', width: 28 }
    ];
    return {
      columns,
      scripts: [],
      script: {},
      defaultScript: {
        enable: true,
        cron: '0 8 * * *',
        type: 'code',
        codeContent: '',
        interpreter: 'python3',
        envVars: [],
        timeout: 300
      },
      loading: true,
      logsModalVisible: false,
      logsLoading: false,
      logsScriptAlias: '',
      logsScriptId: '',
      executionLogs: []
    };
  },
  methods: {
    isMobile () {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    },
    async listScript () {
      this.loading = true;
      try {
        const res = await this.$api().script.list();
        // Filter only code type scripts
        this.scripts = res.data.filter(s => s.type === 'code');
      } catch (e) {
        this.$message().error(e.message);
      }
      this.loading = false;
    },
    async modifyScript () {
      if (!this.script.codeContent || !this.script.codeContent.trim()) {
        this.$message().error('代码不可为空!');
        return;
      }
      this.script.envVars = (this.script.envVars || []).filter(env => env.key && env.key.trim());
      this.script.type = 'code';
      
      try {
        await this.$api().script.modify({ ...this.script });
        this.$message().success((this.script.id ? '编辑' : '新增') + '成功');
        setTimeout(() => this.listScript(), 1000);
        this.clearScript();
      } catch (e) {
        this.$message().error(e.response?.data?.message || e.message);
      }
    },
    async run () {
      if (!this.script.codeContent || !this.script.codeContent.trim()) {
        this.$message().error('代码不可为空!');
        return;
      }
      try {
        const res = await this.$api().script.run({ ...this.script, type: 'code' });
        if (res.success) {
          this.$message().success('执行成功');
        } else {
          this.$message().error(res.message || '执行失败');
        }
        setTimeout(() => this.listScript(), 1000);
      } catch (e) {
        this.$message().error(e.message);
      }
    },
    modifyClick (row) {
      this.script = { ...this.defaultScript, ...row, envVars: row.envVars ? [...row.envVars] : [] };
    },
    async deleteScript (row) {
      try {
        await this.$api().script.delete(row.id);
        this.$message().success('删除成功');
        await this.listScript();
      } catch (e) {
        this.$message().error(e.message);
      }
    },
    clearScript () {
      this.script = { ...this.defaultScript, envVars: [] };
    },
    addEnvVar () {
      if (!this.script.envVars) this.script.envVars = [];
      this.script.envVars.push({ key: '', value: '' });
    },
    removeEnvVar (index) {
      this.script.envVars.splice(index, 1);
    },
    async showLogs (record) {
      this.logsScriptAlias = record.alias || record.id;
      this.logsScriptId = record.id;
      this.logsModalVisible = true;
      this.logsLoading = true;
      this.executionLogs = [];
      try {
        const res = await this.$api().script.getLogs(record.id);
        if (res.success) {
          this.executionLogs = (res.data || []).sort((a, b) => b.timestamp - a.timestamp);
        }
      } catch (e) {
        this.$message().error(e.message);
      }
      this.logsLoading = false;
    },
    closeLogsModal () {
      this.logsModalVisible = false;
      this.executionLogs = [];
    },
    formatLogHeader (log) {
      return new Date(log.timestamp).toLocaleString('zh-CN');
    },
    formatDuration (duration) {
      if (!duration) return '0ms';
      if (duration < 1000) return `${duration}ms`;
      if (duration < 60000) return `${(duration / 1000).toFixed(2)}s`;
      return `${(duration / 60000).toFixed(2)}min`;
    }
  },
  async mounted () {
    this.clearScript();
    this.listScript();
  }
};
</script>
<style scoped>
.script { width: 100%; max-width: 1440px; margin: 0 auto; }
.env-vars-editor { display: flex; flex-direction: column; }
.env-var-row { display: flex; align-items: center; margin-bottom: 8px; }
.execution-logs { max-height: 500px; overflow-y: auto; }
.no-logs { padding: 40px 0; }
.log-details { padding: 8px 0; }
.log-info { display: flex; gap: 24px; margin-bottom: 12px; font-size: 13px; }
.log-output { margin-top: 12px; }
.log-label { font-weight: bold; margin-bottom: 4px; font-size: 13px; }
.log-content { background-color: #f5f5f5; border: 1px solid #d9d9d9; border-radius: 4px; padding: 8px 12px; font-family: 'Consolas', monospace; font-size: 12px; white-space: pre-wrap; word-break: break-all; max-height: 200px; overflow-y: auto; margin: 0; }
.log-error { background-color: #fff2f0; border-color: #ffccc7; color: #cf1322; }
</style>
