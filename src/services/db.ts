import Dexie from 'dexie'

export interface Board {
  id: string
  title: string
  cols?: number
  cells: Array<any>
}

export class AACDB extends Dexie {
  boards!: Dexie.Table<Board, string>

  constructor() {
    super('aac_db')
    this.version(1).stores({
      boards: 'id, title'
    })
  }
}

export const db = new AACDB()
