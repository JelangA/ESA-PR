import datetime
from airflow import DAG
from airflow.operators.dummy_operator import DummyOperator
from airflow.operators.bash_operator import BashOperator
from airflow.utils.dates import days_ago

default_args = {
    'owner': 'student',
    'retries': 1,
    'retry_delay': datetime.timedelta(minutes=3),
}

dag = DAG(
    'simple_csv_to_hive',
    default_args=default_args,
    description='ETL sederhana: membaca CSV, menyimpan Parquet ke HDFS, dan membuat tabel Hive eksternal',
    start_date=days_ago(1),
    schedule_interval='@daily',
)

start = DummyOperator(
    task_id='start',
    dag=dag,
)

spark_transform_csv_to_parquet = BashOperator(
    task_id='spark_transform_csv_to_parquet',
    dag=dag,
    bash_command=(
        'docker exec spark-master '
        '/spark/bin/spark-submit '
        '--master local[*] '
        '--name spark_transform_csv_to_parquet '
        '/home/script/transform_csv_to_parquet.py '
    ),
)

create_hive_sales_table = BashOperator(
    task_id='create_hive_sales_table',
    dag=dag,
    bash_command='docker exec hive-server hive -f /opt/hql/create_hive_table.hql ',
)

end = DummyOperator(
    task_id='end',
    dag=dag,
)

start >> spark_transform_csv_to_parquet >> create_hive_sales_table >> end
