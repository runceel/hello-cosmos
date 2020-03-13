import { CosmosClient } from '@azure/cosmos';
// 環境変数を .env から読み込む
import dotenv from 'dotenv';
import { Hash } from 'crypto';
dotenv.config();

// Cosmos DB に突っ込む型
type Item = {
    id: string | undefined,
    value: string,
    partitionKey: string,
};

async function main() {
    const endpoint = process.env.COSMOS_DB_URI;
    const key = process.env.COSMOS_DB_KEY;
    if (!endpoint || !key) {
        return;
    }

    // Cosmos DB に繋ぐクライアントを作る
    const client = new CosmosClient({
        endpoint: endpoint,
        key: key,
    });

    // DB が無かったら作る
    const { database } = await client.databases.createIfNotExists({ id: 'dbforts' });
    console.log(`${database.id} was created.`);

    // コレクションが無かったら作る
    const { container } = await database.containers.createIfNotExists({ 
        id: 'items', 
        partitionKey: { paths: [ '/partitionKey' ]}
    }, 
    { offerThroughput: 400 });
    
    console.log(`${container.id} was created.`);

    // 適当なデータを突っ込む
    // for (let i = 0; i < 100; i++) {
    //     const { item: item1 } = await container.items.upsert({
    //         partitionKey: 'pk1',
    //         value: `${new Date().toISOString()} ${Math.random() * 1000}`,
    //     });
    //     const { item: item2 } = await container.items.upsert({
    //         partitionKey: 'pk2',
    //         value: `${new Date().toISOString()} ${Math.random() * 1000}`,
    //     });
    //     console.log(`${item1.id} and ${item2.id} were created.`);
    // }

    const { resources, requestCharge } = await container.items.query<Item>({
        query: 'SELECT * FROM items c WHERE CONTAINS(c["value"], @xxx)',
        parameters: [
            { name: '@xxx', value: '000' }
        ]
    }).fetchAll();
    console.log(`requestCharge: ${requestCharge}`);
    for (let x of resources) {
        console.log(`id:${x.id}, value:${x.value}, partitionKey:${x.partitionKey}`);
    }
}

main();
