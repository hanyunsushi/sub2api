<template>
  <!-- 提示信息：低强调说明与 role=status，不替代危险状态。 -->
  <div class="kreepai-info-notice" role="status">
    <span class="kreepai-info-notice-icon" aria-hidden="true">!</span>
    <div class="kreepai-info-notice-body"><slot /></div>
  </div>
</template>

<style scoped>
/* 提示信息：浅底说明、图标与正文分别维护，不编码危险状态。 */
.kreepai-info-notice {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  box-sizing: border-box;
  width: 100%;
  padding: 10px 12px;
  border: 0;
  border-radius: 18px;
  background: var(--accent-soft, #e9f3ff);
  box-shadow: none;
  color: var(--text-2);
  font-size: 12.5px;
  line-height: 1.7;
}
.kreepai-info-notice-icon {
  display: grid;
  flex: 0 0 20px;
  width: 20px;
  height: 20px;
  place-items: center;
  border-radius: 50%;
  background: var(--accent);
  color: #fff;
  font-family: var(--ff-body);
  font-size: 14px;
  font-weight: 700;
  line-height: 20px;
}
.kreepai-info-notice-body { min-width: 0; flex: 1; }
.kreepai-info-notice-body ul { margin: 6px 0 0; padding-left: 20px; }
.kreepai-info-notice--manual { margin-bottom: 12px; }
.kreepai-info-notice--settings { margin-bottom: 14px; }
.kreepai-info-notice--update { margin-top: 8px; }
.kreepai-info-notice--update-flow { margin-top: 16px; }
</style>
