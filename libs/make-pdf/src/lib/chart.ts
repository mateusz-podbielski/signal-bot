import QuickChart from 'quickchart-js';

export interface ChartData {
  data: number[];
  label: string;
  fill: boolean;
}

export enum ChartType {
  line = 'line',
  bar = 'bar'
}

export class Chart {
  private quickChart: QuickChart = new QuickChart();

  public getChart(labels: string[], datasets: ChartData[], type: ChartType = ChartType.line): Promise<string> {
    this.quickChart.setConfig({
      type,
      data: { labels, datasets },
      options: {
        scales: {
          yAxes: [],
        },
      },
    });
    this.quickChart.setBackgroundColor('transparent');

    return this.quickChart.toDataUrl();
  }
}
