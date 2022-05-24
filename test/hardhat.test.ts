import { Ether, Token, CurrencyAmount } from '@uniswap/sdk-core'
import { Erc20__factory } from '../src/types'
import '../src/index'

const CHAIN_ID = 1
const ETH = Ether.onChain(CHAIN_ID)
const UNI = new Token(CHAIN_ID, '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', 18, 'UNI')
const USDT = new Token(CHAIN_ID, '0xdAC17F958D2ee523a2206206994597C13D831ec7', 6, 'USDT')
const USDT_TREASURY = '0x5754284f345afc66a98fbb0a0afe71e0f007b949'

describe('Hardhat', () => {
    beforeEach(async () => await hardhat.fork())

    describe('account', () => {
        it('returns the first account', async () => {
            expect(hardhat.accounts[0]).toBe(hardhat.account)
        })
    })

    describe('providers', () => {
        it('lists accounts', async () => {
            const accounts = await Promise.all(hardhat.providers.map((provider) => provider.listAccounts()))
            const addresses = accounts.map(([address]) => address)
            expect(addresses).toEqual(hardhat.accounts.map(({ address }) => address))
        })

        it('provides signers', async () => {
            const signers = hardhat.providers.map((provider) => provider.getSigner())
            const addresses = await Promise.all(signers.map((signer) => signer.getAddress()))
            expect(addresses.map((address) => address.toLowerCase())).toEqual(hardhat.accounts.map(({ address }) => address))
        })
    })

    describe('provider', () => {
        it('returns the first provider', async () => {
            expect(hardhat.providers[0]).toBe(hardhat.provider)
        })
    })

    describe('fork', () => {
        it('resets the mainnet fork', async () => {
            const BLOCK_NUMBER = 3991688
            await hardhat.fork(BLOCK_NUMBER)
            const blockNumber = await hardhat.send('eth_blockNumber', [])
            expect(Number(blockNumber)).toBe(BLOCK_NUMBER)
        })
    })

    describe('getBalance', () => {
        describe('with an impersonated account', () => {
            it('returns ETH balance', async () => {
                const balance = await hardhat.getBalance(hardhat.account, ETH)
                expect(balance.toExact()).toBe('10000')
            })

            it('returns UNI balance', async () => {
                const balance = await hardhat.getBalance(hardhat.account, UNI)
                expect(balance.toExact()).toBe('0')
            })
        })

        describe('with an external address', () => {
            const address = '0xBE0eB53F46cd790Cd13851d5EFf43D12404d33E8'

            it('returns ETH balance', async () => {
                const balance = await hardhat.getBalance(address, ETH)
                expect(balance.toExact()).toBe('2296896.400432088050687197')
            })

            it('returns UNI balance', async () => {
                const balance = await hardhat.getBalance(address, UNI)
                expect(balance.toExact()).toBe('6000000')
            })
        })
    })

    describe('fund', () => {
        describe('with an impersonated account', () => {
            it('funds ETH balance', async () => {
                const amount = CurrencyAmount.fromRawAmount(ETH, 6000000).multiply(10 ** ETH.decimals)
                await hardhat.fund(hardhat.account, amount)
                const balance = await hardhat.getBalance(hardhat.account, ETH)
                expect(balance.toExact()).toBe('6000000')
            })

            it('funds UNI balance', async () => {
                const amount = CurrencyAmount.fromRawAmount(UNI, 6000000).multiply(10 ** UNI.decimals)
                await hardhat.fund(hardhat.account, amount)
                const balance = await hardhat.getBalance(hardhat.account, UNI)
                expect(balance.toExact()).toBe('6000000')
            })
        })

        describe('with an external address', () => {
            const address = '0x6555e1cc97d3cba6eaddebbcd7ca51d75771e0b8'

            it('funds ETH balance', async () => {
                const amount = CurrencyAmount.fromRawAmount(ETH, 6000000).multiply(10 ** ETH.decimals)
                await hardhat.fund(address, amount)
                const balance = await hardhat.getBalance(address, ETH)
                expect(balance.toExact()).toBe('6000000')
            })

            it('funds UNI balance', async () => {
                const amount = CurrencyAmount.fromRawAmount(UNI, 6000000).multiply(10 ** UNI.decimals)
                await hardhat.fund(address, amount)
                const balance = await hardhat.getBalance(address, UNI)
                expect(balance.toExact()).toBe('6150000.000025615589778183') // includes existing funds
            })
        })

        it('uses custom whales', async () => {
            const amount = CurrencyAmount.fromRawAmount(USDT, 10000).multiply(10 ** USDT.decimals)
            await expect(hardhat.fund(hardhat.account, amount)).rejects.toThrowError('Could not fund 10000 USDT from any whales')

            await hardhat.fund(hardhat.account, amount, [USDT_TREASURY])
            const balance = await hardhat.getBalance(hardhat.account, USDT)
            expect(balance.toExact()).toBe('10000')
        })
    })

    describe('approve', () => {
        const spender = hardhat.accounts[1]
        const token = Erc20__factory.connect(UNI.address, hardhat.providers[1].getSigner())

        beforeEach(async () => {
            await expect(token.transferFrom(hardhat.account.address, spender.address, 1)).rejects.toMatchObject({
                reason: "VM Exception while processing transaction: reverted with reason string 'Uni::transferFrom: transfer amount exceeds spender allowance'",
            })
        })

        it('approves unlimited amount (default)', async () => {
            const amount = CurrencyAmount.fromRawAmount(UNI, 1)
            await hardhat.fund(hardhat.account, amount)
            await hardhat.approve(hardhat.account, spender, UNI)
            await (await token.transferFrom(hardhat.account.address, spender.address, 1)).wait()
            expect((await hardhat.getBalance(hardhat.account, UNI)).toExact()).toBe('0')
            expect((await hardhat.getBalance(spender, UNI)).toExact()).toBe(amount.toExact())
        })

        it('approves a specific amount', async () => {
            const amount = CurrencyAmount.fromRawAmount(UNI, 1)
            await hardhat.approve(hardhat.account, spender, amount)
            await hardhat.fund(hardhat.account, amount.multiply(2))
            await expect(token.transferFrom(hardhat.account.address, spender.address, 2)).rejects.toMatchObject({
                reason: "VM Exception while processing transaction: reverted with reason string 'Uni::transferFrom: transfer amount exceeds spender allowance'",
            })
            await (await token.transferFrom(hardhat.account.address, spender.address, 1)).wait()
            expect((await hardhat.getBalance(hardhat.account, UNI)).toExact()).toBe(amount.toExact())
            expect((await hardhat.getBalance(spender, UNI)).toExact()).toBe(amount.toExact())
        })

        it('rescinds approval (amount = 0)', async () => {
            await hardhat.approve(hardhat.account, spender, CurrencyAmount.fromRawAmount(UNI, 1))
            await hardhat.approve(hardhat.account, spender, CurrencyAmount.fromRawAmount(UNI, 0))
            await expect(token.transferFrom(hardhat.account.address, spender.address, 1)).rejects.toMatchObject({
                reason: "VM Exception while processing transaction: reverted with reason string 'Uni::transferFrom: transfer amount exceeds spender allowance'",
            })
        })
    })
})