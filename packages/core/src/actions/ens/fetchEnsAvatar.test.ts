import { rest } from 'msw'
import { setupServer } from 'msw/node'

import { setupWagmiClient } from '../../../test'
import { chain } from '../../constants'
import { fetchEnsAvatar } from './fetchEnsAvatar'

const handlers = [
  // brantly.eth
  rest.get(
    'https://wrappedpunks.com:3000/api/punks/metadata/2430',
    (_req, res, ctx) =>
      res(
        ctx.status(200),
        ctx.json({
          title: 'W#2430',
          name: 'W#2430',
          description:
            'This Punk was wrapped using Wrapped Punks contract, accessible from https://wrappedpunks.com',
          image: 'https://api.wrappedpunks.com/images/punks/2430.png',
          external_url: 'https://wrappedpunks.com',
        }),
      ),
  ),
  // nick.eth
  rest.get(
    'https://api.opensea.io/api/v1/metadata/0x495f947276749Ce646f68AC8c248420045cb7b5e/0x11ef687cfeb2e353670479f2dcc76af2bc6b3935000000000002c40000000001',
    (_req, res, ctx) =>
      res(
        ctx.status(200),
        ctx.json({
          name: 'Nick Johnson',
          description: null,
          external_link: null,
          image:
            'https://lh3.googleusercontent.com/hKHZTZSTmcznonu8I6xcVZio1IF76fq0XmcxnvUykC-FGuVJ75UPdLDlKJsfgVXH9wOSmkyHw0C39VAYtsGyxT7WNybjQ6s3fM3macE',
          animation_url: null,
        }),
      ),
  ),
]

const server = setupServer(...handlers)

describe('fetchEnsAvatar', () => {
  beforeAll(() =>
    server.listen({
      onUnhandledRequest(req) {
        if (req.url.origin !== chain.hardhat.rpcUrls[0])
          console.warn(
            `Found an unhandled ${req.method} request to ${req.url.href}`,
          )
      },
    }),
  )

  beforeEach(() => {
    setupWagmiClient()
  })

  afterEach(() => server.resetHandlers())

  afterAll(() => server.close())

  it('no result', async () => {
    const result = await fetchEnsAvatar({ addressOrName: 'awkweb.eth' })
    expect(result).toMatchInlineSnapshot(`null`)
  })

  describe('has avatar', () => {
    it('erc1155', async () => {
      const result = await fetchEnsAvatar({
        addressOrName: 'nick.eth',
      })
      expect(result).toMatchInlineSnapshot(
        `"https://lh3.googleusercontent.com/hKHZTZSTmcznonu8I6xcVZio1IF76fq0XmcxnvUykC-FGuVJ75UPdLDlKJsfgVXH9wOSmkyHw0C39VAYtsGyxT7WNybjQ6s3fM3macE"`,
      )
    })

    it('erc721', async () => {
      const result = await fetchEnsAvatar({
        addressOrName: 'brantly.eth',
      })
      expect(result).toMatchInlineSnapshot(
        `"https://api.wrappedpunks.com/images/punks/2430.png"`,
      )
    })

    it('custom', async () => {
      const result = await fetchEnsAvatar({
        addressOrName: 'tanrikulu.eth',
      })
      expect(result).toMatchInlineSnapshot(
        `"https://ipfs.io/ipfs/QmUShgfoZQSHK3TQyuTfUpsc8UfeNfD8KwPUvDBUdZ4nmR"`,
      )
    })
  })
})