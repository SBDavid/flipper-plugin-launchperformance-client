import React, {createRef, CSSProperties} from 'react';
import {PluginClient, usePlugin, createState, 
  useValue, Layout, DataTableColumn, 
  createDataSource, DataTableManager, DataTable} from 'flipper-plugin';
import { Tabs, Button } from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  DeleteOutlined,
} from '@ant-design/icons';

import {baseRowStyle} from './logTypes';

// JS模块加载性能日志
export declare type PerformanceLogEntry = {
  readonly name: string;
  readonly entryType: 'mark' | 'measure';
  readonly startTime: number;
  readonly duration: number;
  readonly detail?: any;
  readonly isBase: boolean;
};

type Events = {
  measure: PerformanceLogEntry;
  JS_require_start: PerformanceLogEntry;
};

function _fix(number: number, length: number) {
  let str = `${number}`;
  str = str.padStart(length, '0');
  return str;
}

// 数据表的格式
function createColumnConfig(): DataTableColumn<PerformanceLogEntry>[] {
  return [
    {
      key: 'name',
      title: 'Name',
      width: 400,
    },
    {
      key: 'isBase',
      title: 'isBase',
      width: 50,
    },
    // {
    //   key: 'startTime',
    //   title: 'StartTime',
    //   width: 100,
    //   onRender: (row) => {
    //     const date = new Date();
    //     date.setTime(row.startTime);
    //     return `${_fix(date.getHours(), 2)}:${_fix(date.getMinutes(), 2)}:${_fix(date.getSeconds(), 2)}.${_fix(date.getMilliseconds(), 3)}`;
    //   }
    // },
    {
      key: 'duration',
      title: 'Duration',
      width: 50,
    },
    {
      key: 'startTime',
      title: 'StartTime',
      width: 150,
    },
  ];
}

function getRowStyle(entry: PerformanceLogEntry): CSSProperties | undefined {
  return baseRowStyle;
}

// Read more: https://fbflipper.com/docs/tutorial/js-custom#creating-a-first-plugin
// API: https://fbflipper.com/docs/extending/flipper-plugin#pluginclient
export function plugin(client: PluginClient<Events, {}>) {
  const rows = createDataSource<PerformanceLogEntry>([], {
    limit: 200000,
    persist: 'logs',
  });
  const isPaused = createState(true);
  const tableManagerRef =
    createRef<undefined | DataTableManager<PerformanceLogEntry>>();

  client.onConnect(() => {
  });

  client.onActivate(() => {
  });

  client.onReady(() => {
  });

  client.onMessage('measure', row => {
    if (!isPaused.get()) {
      rows.append(row);
    }
  });

  client.onMessage('JS_require_start', event => {
    clearLogs();
    rows.append(event);
  });

  client.onDisconnect(() => {
  });

  function resumePause() {
    if (isPaused.get() && client.device.isConnected) {
      isPaused.set(false);
    } else {
      isPaused.set(true);
    }
  }
  resumePause();

  function clearLogs() {
    rows.clear();
    tableManagerRef.current?.clearSelection();
  }

  const columns = createColumnConfig();

  return {
    rows,
    columns,
    isPaused,
    tableManagerRef,
    resumePause,
    isConnected: client.device.isConnected,
    clearLogs
  };
}

// Read more: https://fbflipper.com/docs/tutorial/js-custom#building-a-user-interface-for-the-plugin
// API: https://fbflipper.com/docs/extending/flipper-plugin#react-hooks
export function Component() {

  const p = usePlugin(plugin);
  const paused = useValue(p.isPaused);

  return (
    <DataTable<PerformanceLogEntry>
      dataSource={p.rows}
      columns={p.columns}
      enableAutoScroll
      onRowStyle={getRowStyle}
      tableManagerRef={p.tableManagerRef}
      extraActions={
        p.isConnected ? (
          <>
            <Button
              title={`Click to ${paused ? 'resume' : 'pause'} the log stream`}
              danger={paused}
              onClick={p.resumePause}>
              {paused ? <PlayCircleOutlined /> : <PauseCircleOutlined />}
            </Button>
            <Button title="Clear logs" onClick={p.clearLogs}>
              <DeleteOutlined />
            </Button>
          </>
        ) : undefined
      }
    />
  );
}
